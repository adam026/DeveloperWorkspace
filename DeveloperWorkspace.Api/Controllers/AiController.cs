
using DeveloperWorkspace.Api.Models;
using DeveloperWorkspace.Api.Services;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;

namespace DeveloperWorkspace.Api.Controllers;

[ApiController]
[Route("api/ai")]
public sealed class AiController : ControllerBase
{
    private readonly OllamaService _ollamaService;
    private readonly DocumentService _documentService;

    public AiController(
        OllamaService ollamaService,
        DocumentService documentService)
    {
        _ollamaService = ollamaService;
        _documentService = documentService;
    }

    [HttpPost("summarize")]
    public async Task<ActionResult<SummarizeResponse>> Summarize(
        [FromBody] SummarizeRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Text))
        {
            return BadRequest(new
            {
                message = "Az összefoglaláshoz szükséges szöveg nem lehet üres."
            });
        }

        if (request.Text.Length > 30000)
        {
            return BadRequest(new
            {
                message = "A szöveg legfeljebb 30 000 karakter lehet."
            });
        }

        try
        {
            var summary = await _ollamaService.SummarizeAsync(
                request.Text,
                cancellationToken);

            return Ok(new SummarizeResponse(summary));
        }
        catch (HttpRequestException)
        {
            return StatusCode(503, new
            {
                message = "Az Ollama jelenleg nem érhető el. Ellenőrizd, hogy fut-e."
            });
        }
        catch (TaskCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return StatusCode(504, new
            {
                message = "Az AI-összefoglalás időtúllépés miatt megszakadt."
            });
        }
    }

    [HttpPost("documents/{id}/summarize")]
    public async Task<ActionResult<SummarizeResponse>> SummarizeDocument(
        string id,
        CancellationToken cancellationToken)
    {
        if (!ObjectId.TryParse(id, out _))
        {
            return BadRequest(new
            {
                message = "Érvénytelen dokumentumazonosító."
            });
        }

        var document = await _documentService.GetByIdAsync(id);

        if (document is null)
        {
            return NotFound(new
            {
                message = "A dokumentum nem található."
            });
        }

        var text = $"""
            Cím: {document.Title}
            Kategória: {document.Category}
            Leírás: {document.Description}
            """;

        try
        {
            var summary = await _ollamaService.SummarizeAsync(
                text,
                cancellationToken);

            var saved = await _documentService.SaveAiSummaryAsync(id, summary);

            if (!saved)
            {
                return NotFound(new
                {
                    message = "A dokumentum nem található a mentés során."
                });
            }

            return Ok(new SummarizeResponse(summary));
        }
        catch (HttpRequestException)
        {
            return StatusCode(503, new
            {
                message = "Az Ollama jelenleg nem érhető el. Ellenőrizd, hogy fut-e."
            });
        }
        catch (TaskCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return StatusCode(504, new
            {
                message = "Az AI-összefoglalás időtúllépés miatt megszakadt."
            });
        }
    }
}

public sealed record SummarizeRequest(string Text);

public sealed record SummarizeResponse(string Summary);
