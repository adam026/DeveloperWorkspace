using DeveloperWorkspace.Api.Models;
using DeveloperWorkspace.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace DeveloperWorkspace.Api.Controllers
{
    [ApiController]
    [Route("api/architectureprojects")]
    public class ArchitectureProjectsController : ControllerBase
    {
        private readonly ArchitectureProjectService _service;

        public ArchitectureProjectsController(
            ArchitectureProjectService service)
        {
            _service = service;
        }

        // GET: api/architectureprojects
        [HttpGet]
        public async Task<ActionResult<List<ArchitectureProject>>> GetAll()
        {
            var projects = await _service.GetAllAsync();
            return Ok(projects);
        }

        // GET: api/architectureprojects/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<ArchitectureProject>> GetById(string id)
        {
            var project = await _service.GetByIdAsync(id);

            if (project is null)
            {
                return NotFound();
            }

            return Ok(project);
        }

        // POST: api/architectureprojects
        [HttpPost]
        public async Task<ActionResult<ArchitectureProject>> Create(
            [FromBody] ArchitectureProject project)
        {
            if (string.IsNullOrWhiteSpace(project.Name))
            {
                return BadRequest("A projekt neve kötelező.");
            }

            var createdProject = await _service.CreateAsync(project);

            return CreatedAtAction(
                nameof(GetById),
                new { id = createdProject.Id },
                createdProject);
        }

        // PUT: api/architectureprojects/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            string id,
            [FromBody] ArchitectureProject project)
        {
            if (string.IsNullOrWhiteSpace(project.Name))
            {
                return BadRequest("A projekt neve kötelező.");
            }

            var updated = await _service.UpdateAsync(id, project);

            if (!updated)
            {
                return NotFound();
            }

            return NoContent();
        }

        // DELETE: api/architectureprojects/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var deleted = await _service.DeleteAsync(id);

            if (!deleted)
            {
                return NotFound();
            }

            return NoContent();
        }
    }
}

