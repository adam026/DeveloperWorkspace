
using DeveloperWorkspace.Api.Models;
using DeveloperWorkspace.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace DeveloperWorkspace.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DocumentsController : ControllerBase
    {
        private readonly DocumentService _documentService;

        public DocumentsController(DocumentService documentService)
        {
            _documentService = documentService;
        }

        [HttpGet]
        public async Task<ActionResult<List<Document>>> GetAll()
        {
            var documents = await _documentService.GetAllAsync();
            return Ok(documents);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Document>> GetById(string id)
        {
            var document = await _documentService.GetByIdAsync(id);

            if (document is null)
            {
                return NotFound();
            }

            return Ok(document);
        }

        [HttpPost]
        public async Task<ActionResult<Document>> Create(Document document)
        {
            if (string.IsNullOrWhiteSpace(document.Title))
            {
                return BadRequest("A dokumentum címe kötelező.");
            }

            var createdDocument = await _documentService.CreateAsync(document);

            return CreatedAtAction(
                nameof(GetById),
                new { id = createdDocument.Id },
                createdDocument);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, Document document)
        {
            if (string.IsNullOrWhiteSpace(document.Title))
            {
                return BadRequest("A dokumentum címe kötelező.");
            }

            var updated = await _documentService.UpdateAsync(id, document);

            if (!updated)
            {
                return NotFound();
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var deleted = await _documentService.DeleteAsync(id);

            if (!deleted)
            {
                return NotFound();
            }

            return NoContent();
        }
    }
}
