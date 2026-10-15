using DeveloperWorkspace.Api.Models;
using DeveloperWorkspace.Api.Services;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;

namespace DeveloperWorkspace.Api.Controllers;

[ApiController]
[Route("api/markdown-documents")]
public class MarkdownDocumentsController : ControllerBase
{
    private readonly MarkdownDocumentService _service;
    private readonly OllamaService _ollamaService;

    public MarkdownDocumentsController(MarkdownDocumentService service, OllamaService ollamaService)
    {
        _service = service;
        _ollamaService = ollamaService;
    }

    [HttpGet]
    public async Task<ActionResult<List<MarkdownDocument>>> GetAll()
    {
        var documents = await _service.GetAllAsync();
        return Ok(documents);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<MarkdownDocument>> GetById(string id)
    {
        if (!ObjectId.TryParse(id, out _))
        {
            return BadRequest("Érvénytelen dokumentumazonosító.");
        }

        var document = await _service.GetByIdAsync(id);

        if (document is null)
        {
            return NotFound();
        }

        return Ok(document);
    }

    [HttpPost]
    public async Task<ActionResult<MarkdownDocument>> Create(
        MarkdownDocument document)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var created = await _service.CreateAsync(document);

        return CreatedAtAction(
            nameof(GetById),
            new { id = created.Id },
            created);
    }


    [HttpPost("generate")]
    public async Task<ActionResult<MarkdownDocument>> Generate(
        GenerateMarkdownRequest request,
        CancellationToken cancellationToken)
    {
        var supportedTypes = new[]
        {
        "Agent",
        "Domain",
        "HowTo",
        "Rule",
        "Skill",
        "CopilotInstructions"
    };

        if (!supportedTypes.Contains(
            request.FileType,
            StringComparer.OrdinalIgnoreCase))
        {
            return BadRequest("Unsupported Markdown file type.");
        }

        try
        {
            var content = await _ollamaService.GenerateMarkdownAsync(
                request.FileType,
                request.Name.Trim(),
                request.Description.Trim(),
                request.Requirements.Trim(),
                cancellationToken);

            var document = new MarkdownDocument
            {
                Name = request.Name.Trim(),
                FileType = request.FileType,
                Description = request.Description.Trim(),
                Content = content,
                FilePath = request.FilePath.Trim()
            };

            var created = await _service.CreateAsync(document);

            return CreatedAtAction(
                nameof(GetById),
                new { id = created.Id },
                created);
        }
        catch (OperationCanceledException)
            when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (HttpRequestException)
        {
            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                "The Ollama service is unavailable.");
        }
        catch (TaskCanceledException)
        {
            return StatusCode(
                StatusCodes.Status504GatewayTimeout,
                "The Markdown generation request timed out.");
        }
        catch (InvalidOperationException)
        {
            return StatusCode(
                StatusCodes.Status502BadGateway,
                "Ollama returned an invalid response.");
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(
        string id,
        MarkdownDocument document)
    {
        if (!ObjectId.TryParse(id, out _))
        {
            return BadRequest("Érvénytelen dokumentumazonosító.");
        }

        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var updated = await _service.UpdateAsync(id, document);

        if (!updated)
        {
            return NotFound();
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        if (!ObjectId.TryParse(id, out _))
        {
            return BadRequest("Érvénytelen dokumentumazonosító.");
        }

        var deleted = await _service.DeleteAsync(id);

        if (!deleted)
        {
            return NotFound();
        }

        return NoContent();
    }
}

