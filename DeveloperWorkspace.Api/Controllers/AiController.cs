
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
    private readonly ProjectDocumentationService _projectDocumentationService;

    public AiController(
        OllamaService ollamaService,
        DocumentService documentService,
        ProjectDocumentationService projectDocumentationService)
    {
        _ollamaService = ollamaService;
        _documentService = documentService;
        _projectDocumentationService = projectDocumentationService;
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

    [HttpPost("documentation/generate")]
    public async Task<ActionResult<GenerateDocumentationResponse>> GenerateDocumentation(
    [FromBody] GenerateDocumentationRequest request,
    CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.ProjectName))
            return BadRequest("Project name is required.");

        if (string.IsNullOrWhiteSpace(request.Category))
            return BadRequest("Documentation category is required.");

        if (request.ProjectName.Length > 200 ||
            (request.Description?.Length ?? 0) > 5000 ||
            (request.Technologies?.Length ?? 0) > 2000 ||
            (request.AdditionalContext?.Length ?? 0) > 15000)
        {
            return BadRequest("One or more fields exceed the allowed length.");
        }

        try
        {
            var content = await _ollamaService.GenerateDocumentationAsync(
                request.Category,
                request.ProjectName,
                request.Description ?? string.Empty,
                request.Technologies ?? string.Empty,
                request.AdditionalContext ?? string.Empty,
                cancellationToken);

            return Ok(new GenerateDocumentationResponse(content));
        }
        catch (HttpRequestException)
        {
            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                "The AI service is currently unavailable.");
        }
        catch (TaskCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return StatusCode(
                StatusCodes.Status504GatewayTimeout,
                "The AI request timed out.");
        }
    }

    [HttpPost("documentation/improve")]
    public async Task<ActionResult<ImproveDocumentationResponse>> ImproveDocumentation(
    [FromBody] ImproveDocumentationRequest request,
    CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Content))
            return BadRequest("Documentation content is required.");

        if (request.Content.Length > 30000 ||
            (request.AdditionalInstructions?.Length ?? 0) > 5000)
        {
            return BadRequest("One or more fields exceed the allowed length.");
        }

        try
        {
            var content = await _ollamaService.ImproveDocumentationAsync(
                request.Content,
                request.AdditionalInstructions ?? string.Empty,
                cancellationToken);

            return Ok(new ImproveDocumentationResponse(content));
        }
        catch (HttpRequestException)
        {
            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                "The AI service is currently unavailable.");
        }
        catch (TaskCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return StatusCode(
                StatusCodes.Status504GatewayTimeout,
                "The AI request timed out.");
        }
    }

    [HttpPost("documentation/summarize")]
    public async Task<ActionResult<SummarizeResponse>> SummarizeDocumentation(
    [FromBody] SummarizeDocumentationRequest request,
    CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Content))
            return BadRequest("Documentation content is required.");

        if (request.Content.Length > 30000)
            return BadRequest("Documentation content exceeds the allowed length.");

        try
        {
            var summary = await _ollamaService.SummarizeAsync(
                request.Content,
                cancellationToken);

            return Ok(new SummarizeResponse(summary));
        }
        catch (HttpRequestException)
        {
            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                "The AI service is currently unavailable.");
        }
        catch (TaskCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return StatusCode(
                StatusCodes.Status504GatewayTimeout,
                "The AI request timed out.");
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

public sealed record GenerateDocumentationRequest(
    string ProjectName,
    string Category,
    string? Description,
    string? Technologies,
    string? AdditionalContext);

public sealed record GenerateDocumentationResponse(string Content);

public sealed record ImproveDocumentationRequest(
    string Content,
    string? AdditionalInstructions);

public sealed record ImproveDocumentationResponse(string Content);

public sealed record SummarizeDocumentationRequest(string Content);
