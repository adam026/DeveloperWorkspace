using DeveloperWorkspace.Api.Models;
using DeveloperWorkspace.Api.Services;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;

namespace DeveloperWorkspace.Api.Controllers
{
    [ApiController]
    [Route("api/documentationprojects/{projectId}/documents")]
    public class ProjectDocumentationsController : ControllerBase
    {
        private readonly ProjectDocumentationService _documentationService;
        private readonly DocumentationProjectService _projectService;

        public ProjectDocumentationsController(
            ProjectDocumentationService documentationService,
            DocumentationProjectService projectService)
        {
            _documentationService = documentationService;
            _projectService = projectService;
        }

        // GET: api/documentationprojects/{projectId}/documents
        [HttpGet]
        public async Task<ActionResult<List<ProjectDocumentation>>> GetByProjectId(
            string projectId)
        {
            if (!ObjectId.TryParse(projectId, out _))
            {
                return BadRequest("Invalid project ID.");
            }

            var project = await _projectService.GetByIdAsync(projectId);

            if (project is null)
            {
                return NotFound("Project not found.");
            }

            var documents = await _documentationService
                .GetByProjectIdAsync(projectId);

            return Ok(documents);
        }

        // GET: api/documentationprojects/{projectId}/documents/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<ProjectDocumentation>> GetById(
            string projectId,
            string id)
        {
            if (!ObjectId.TryParse(projectId, out _) ||
                !ObjectId.TryParse(id, out _))
            {
                return BadRequest("Invalid ID.");
            }

            var document = await _documentationService.GetByIdAsync(id);

            if (document is null || document.ProjectId != projectId)
            {
                return NotFound();
            }

            return Ok(document);
        }

        // POST: api/documentationprojects/{projectId}/documents
        [HttpPost]
        public async Task<ActionResult<ProjectDocumentation>> Create(
            string projectId,
            [FromBody] ProjectDocumentation document)
        {
            if (!ObjectId.TryParse(projectId, out _))
            {
                return BadRequest("Invalid project ID.");
            }

            var project = await _projectService.GetByIdAsync(projectId);

            if (project is null)
            {
                return NotFound("Project not found.");
            }

            if (string.IsNullOrWhiteSpace(document.Title) ||
                string.IsNullOrWhiteSpace(document.Category))
            {
                return BadRequest("Title and category are required.");
            }

            document.ProjectId = projectId;

            var createdDocument = await _documentationService
                .CreateAsync(document);

            return CreatedAtAction(
                nameof(GetById),
                new { projectId, id = createdDocument.Id },
                createdDocument);
        }

        // PUT: api/documentationprojects/{projectId}/documents/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            string projectId,
            string id,
            [FromBody] ProjectDocumentation document)
        {
            if (!ObjectId.TryParse(projectId, out _) ||
                !ObjectId.TryParse(id, out _))
            {
                return BadRequest("Invalid ID.");
            }

            var existingDocument = await _documentationService.GetByIdAsync(id);

            if (existingDocument is null ||
                existingDocument.ProjectId != projectId)
            {
                return NotFound();
            }

            if (string.IsNullOrWhiteSpace(document.Title) ||
                string.IsNullOrWhiteSpace(document.Category))
            {
                return BadRequest("Title and category are required.");
            }

            document.ProjectId = projectId;

            var updated = await _documentationService.UpdateAsync(id, document);

            if (!updated)
            {
                return NotFound();
            }

            return NoContent();
        }

        // DELETE: api/documentationprojects/{projectId}/documents/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(
            string projectId,
            string id)
        {
            if (!ObjectId.TryParse(projectId, out _) ||
                !ObjectId.TryParse(id, out _))
            {
                return BadRequest("Invalid ID.");
            }

            var existingDocument = await _documentationService.GetByIdAsync(id);

            if (existingDocument is null ||
                existingDocument.ProjectId != projectId)
            {
                return NotFound();
            }

            var deleted = await _documentationService.DeleteAsync(id);

            if (!deleted)
            {
                return NotFound();
            }

            return NoContent();
        }
    }
}