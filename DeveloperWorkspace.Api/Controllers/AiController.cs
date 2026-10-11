
using DeveloperWorkspace.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace DeveloperWorkspace.Api.Controllers;

[ApiController]
[Route("api/ai")]
public sealed class AiController : ControllerBase
{
    private readonly OllamaService _ollamaService;

    public AiController(OllamaService ollamaService)
    {
        _ollamaService = ollamaService;
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
}

public sealed record SummarizeRequest(string Text);

public sealed record SummarizeResponse(string Summary);

