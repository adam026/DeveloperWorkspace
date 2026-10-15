using DeveloperWorkspace.Api.Models;
using DeveloperWorkspace.Api.Services;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;

namespace DeveloperWorkspace.Api.Controllers;

[ApiController]
[Route("api/agents")]
public class AgentsController : ControllerBase
{
    private readonly AgentService _agentService;

    public AgentsController(AgentService agentService)
    {
        _agentService = agentService;
    }

    [HttpGet]
    public async Task<ActionResult<List<Agent>>> GetAll()
    {
        var agents = await _agentService.GetAllAsync();
        return Ok(agents);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Agent>> GetById(string id)
    {
        if (!ObjectId.TryParse(id, out _))
        {
            return BadRequest("Érvénytelen agentazonosító.");
        }

        var agent = await _agentService.GetByIdAsync(id);

        if (agent is null)
        {
            return NotFound();
        }

        return Ok(agent);
    }

    [HttpPost]
    public async Task<ActionResult<Agent>> Create(Agent agent)
    {
        var createdAgent = await _agentService.CreateAsync(agent);

        return CreatedAtAction(
            nameof(GetById),
            new { id = createdAgent.Id },
            createdAgent);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, Agent agent)
    {
        if (!ObjectId.TryParse(id, out _))
        {
            return BadRequest("Érvénytelen agentazonosító.");
        }

        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var updated = await _agentService.UpdateAsync(id, agent);

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
            return BadRequest("Érvénytelen agentazonosító.");
        }

        var deleted = await _agentService.DeleteAsync(id);

        if (!deleted)
        {
            return NotFound();
        }

        return NoContent();
    }
}

