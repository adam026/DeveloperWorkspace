using DeveloperWorkspace.Api.Services;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using TaskModel = DeveloperWorkspace.Api.Models.Task;

namespace DeveloperWorkspace.Api.Controllers;

[ApiController]
[Route("api/tasks")]
public class TaskController : ControllerBase
{
    private readonly TaskService _taskService;

    public TaskController(TaskService taskService)
    {
        _taskService = taskService;
    }

    [HttpGet]
    public async Task<ActionResult<List<TaskModel>>> GetAll()
    {
        var tasks = await _taskService.GetAllAsync();
        return Ok(tasks);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TaskModel>> GetById(string id)
    {
        if (!ObjectId.TryParse(id, out _))
        {
            return BadRequest("Invalid task ID.");
        }

        var task = await _taskService.GetByIdAsync(id);

        if (task is null)
        {
            return NotFound("Task not found.");
        }

        return Ok(task);
    }

    [HttpGet("project/{projectId}")]
    public async Task<ActionResult<List<TaskModel>>> GetByProjectId(
        string projectId)
    {
        if (!ObjectId.TryParse(projectId, out _))
        {
            return BadRequest("Invalid project ID.");
        }

        var tasks = await _taskService.GetByProjectIdAsync(projectId);

        return Ok(tasks);
    }

    [HttpPost]
    public async Task<ActionResult<TaskModel>> Create(
        [FromBody] TaskModel task)
    {
        if (string.IsNullOrWhiteSpace(task.Title))
        {
            return BadRequest("Task title is required.");
        }

        if (task.Title.Length > 200 ||
            (task.Description?.Length ?? 0) > 5000)
        {
            return BadRequest("Task data exceeds the allowed length.");
        }

        var createdTask = await _taskService.CreateAsync(task);

        return CreatedAtAction(
            nameof(GetById),
            new { id = createdTask.Id },
            createdTask);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(
        string id,
        [FromBody] TaskModel task)
    {
        if (!ObjectId.TryParse(id, out _))
        {
            return BadRequest("Invalid task ID.");
        }

        if (string.IsNullOrWhiteSpace(task.Title))
        {
            return BadRequest("Task title is required.");
        }

        if (task.Title.Length > 200 ||
            (task.Description?.Length ?? 0) > 5000)
        {
            return BadRequest("Task data exceeds the allowed length.");
        }

        var updated = await _taskService.UpdateAsync(id, task);

        if (!updated)
        {
            return NotFound("Task not found.");
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        if (!ObjectId.TryParse(id, out _))
        {
            return BadRequest("Invalid task ID.");
        }

        var deleted = await _taskService.DeleteAsync(id);

        if (!deleted)
        {
            return NotFound("Task not found.");
        }

        return NoContent();
    }
}