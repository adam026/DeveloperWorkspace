using DeveloperWorkspace.Api.Data;
using DeveloperWorkspace.Api.Models;
using MongoDB.Driver;

namespace DeveloperWorkspace.Api.Services
{
    public class ProjectDocumentationService
    {
        private readonly IMongoCollection<ProjectDocumentation> _documents;

        public ProjectDocumentationService(MongoDbContext context)
        {
            _documents = context.Database
                .GetCollection<ProjectDocumentation>("projectDocumentations");
        }

        public async Task<List<ProjectDocumentation>> GetByProjectIdAsync(
            string projectId)
        {
            return await _documents
                .Find(document => document.ProjectId == projectId)
                .ToListAsync();
        }

        public async Task<ProjectDocumentation?> GetByIdAsync(string id)
        {
            return await _documents
                .Find(document => document.Id == id)
                .FirstOrDefaultAsync();
        }

        public async Task<ProjectDocumentation> CreateAsync(
            ProjectDocumentation document)
        {
            document.Id = null;
            document.CreatedAt = DateTime.UtcNow;
            document.UpdatedAt = null;

            await _documents.InsertOneAsync(document);

            return document;
        }

        public async Task<bool> UpdateAsync(
            string id,
            ProjectDocumentation updatedDocument)
        {
            var existingDocument = await GetByIdAsync(id);

            if (existingDocument is null)
            {
                return false;
            }

            existingDocument.Title = updatedDocument.Title;
            existingDocument.Category = updatedDocument.Category;
            existingDocument.Content = updatedDocument.Content;
            existingDocument.Tags = updatedDocument.Tags;
            existingDocument.UpdatedAt = DateTime.UtcNow;

            var result = await _documents.ReplaceOneAsync(
                document => document.Id == id,
                existingDocument);

            return result.MatchedCount > 0;
        }

        public async Task<bool> DeleteAsync(string id)
        {
            var result = await _documents.DeleteOneAsync(
                document => document.Id == id);

            return result.DeletedCount > 0;
        }

        public async Task DeleteByProjectIdAsync(string projectId)
        {
            await _documents.DeleteManyAsync(
                document => document.ProjectId == projectId);
        }
    }
}