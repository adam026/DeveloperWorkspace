using DeveloperWorkspace.Api.Models;
using DeveloperWorkspace.Api.Services;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;

namespace DeveloperWorkspace.Api.Controllers
{
    [ApiController]
    [Route("api/documentationprojects")]
    public class DocumentationProjectsController : ControllerBase
    {
        private readonly DocumentationProjectService _projectService;
        private readonly ProjectDocumentationService _documentationService;

        public DocumentationProjectsController(
            DocumentationProjectService projectService,
            ProjectDocumentationService documentationService)
        {
            _projectService = projectService;
            _documentationService = documentationService;
        }

        // GET: api/documentationprojects
        [HttpGet]
        public async Task<ActionResult<List<DocumentationProject>>> GetAll()
        {
            var projects = await _projectService.GetAllAsync();
            return Ok(projects);
        }

        // GET: api/documentationprojects/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<DocumentationProject>> GetById(string id)
        {
            if (!ObjectId.TryParse(id, out _))
            {
                return BadRequest("Invalid project ID.");
            }

            var project = await _projectService.GetByIdAsync(id);

            if (project is null)
            {
                return NotFound();
            }

            return Ok(project);
        }

        // POST: api/documentationprojects
        [HttpPost]
        public async Task<ActionResult<DocumentationProject>> Create(
            [FromBody] DocumentationProject project)
        {
            if (string.IsNullOrWhiteSpace(project.Name))
            {
                return BadRequest("Project name is required.");
            }

            var createdProject = await _projectService.CreateAsync(project);

            return CreatedAtAction(
                nameof(GetById),
                new { id = createdProject.Id },
                createdProject);
        }

        // PUT: api/documentationprojects/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            string id,
            [FromBody] DocumentationProject project)
        {
            if (!ObjectId.TryParse(id, out _))
            {
                return BadRequest("Invalid project ID.");
            }

            if (string.IsNullOrWhiteSpace(project.Name))
            {
                return BadRequest("Project name is required.");
            }

            var updated = await _projectService.UpdateAsync(id, project);

            if (!updated)
            {
                return NotFound();
            }

            return NoContent();
        }

        // DELETE: api/documentationprojects/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            if (!ObjectId.TryParse(id, out _))
            {
                return BadRequest("Invalid project ID.");
            }

            var deleted = await _projectService.DeleteAsync(id);

            if (!deleted)
            {
                return NotFound();
            }

            await _documentationService.DeleteByProjectIdAsync(id);

            return NoContent();
        }
    }
}