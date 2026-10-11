
using DeveloperWorkspace.Api.Models;
using DeveloperWorkspace.Api.Services;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;

namespace DeveloperWorkspace.Api.Controllers;

[ApiController]
[Route("api/prompts")]
public sealed class PromptsController : ControllerBase
{
    private readonly PromptService _promptService;

    public PromptsController(PromptService promptService)
    {
        _promptService = promptService;
    }

    [HttpGet]
    public async Task<ActionResult<List<Prompt>>> GetAll()
    {
        var prompts = await _promptService.GetAllAsync();
        return Ok(prompts);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Prompt>> GetById(string id)
    {
        if (!ObjectId.TryParse(id, out _))
        {
            return BadRequest("Érvénytelen promptazonosító.");
        }

        var prompt = await _promptService.GetByIdAsync(id);

        if (prompt is null)
        {
            return NotFound();
        }

        return Ok(prompt);
    }

    [HttpPost]
    public async Task<ActionResult<Prompt>> Create(Prompt prompt)
    {
        if (string.IsNullOrWhiteSpace(prompt.Title))
        {
            return BadRequest("A prompt címe kötelező.");
        }

        if (string.IsNullOrWhiteSpace(prompt.Content))
        {
            return BadRequest("A prompt szövege kötelező.");
        }

        var created = await _promptService.CreateAsync(prompt);

        return CreatedAtAction(
            nameof(GetById),
            new { id = created.Id },
            created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, Prompt prompt)
    {
        if (!ObjectId.TryParse(id, out _))
        {
            return BadRequest("Érvénytelen promptazonosító.");
        }

        if (string.IsNullOrWhiteSpace(prompt.Title))
        {
            return BadRequest("A prompt címe kötelező.");
        }

        if (string.IsNullOrWhiteSpace(prompt.Content))
        {
            return BadRequest("A prompt szövege kötelező.");
        }

        var updated = await _promptService.UpdateAsync(id, prompt);

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
            return BadRequest("Érvénytelen promptazonosító.");
        }

        var deleted = await _promptService.DeleteAsync(id);

        if (!deleted)
        {
            return NotFound();
        }

        return NoContent();
    }
}
