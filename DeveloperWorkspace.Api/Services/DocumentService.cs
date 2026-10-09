using DeveloperWorkspace.Api.Data;
using DeveloperWorkspace.Api.Models;
using MongoDB.Driver;

namespace DeveloperWorkspace.Api.Services
{
    public class DocumentService
    {
        private readonly IMongoCollection<Document> _documents;

        public DocumentService(MongoDbContext context)
        {
            _documents = context.Database
                .GetCollection<Document>("documents");
        }

        public async Task<List<Document>> GetAllAsync()
        {
            return await _documents
                .Find(_ => true)
                .ToListAsync();
        }

        public async Task<Document?> GetByIdAsync(string id)
        {
            return await _documents
                .Find(document => document.Id == id)
                .FirstOrDefaultAsync();
        }

        public async Task<Document> CreateAsync(Document document)
        {
            document.Id = null;
            document.CreatedAt = DateTime.UtcNow;
            document.UpdatedAt = null;

            await _documents.InsertOneAsync(document);

            return document;
        }

        public async Task<bool> UpdateAsync(string id, Document updatedDocument)
        {
            var existingDocument = await GetByIdAsync(id);

            if (existingDocument is null)
            {
                return false;
            }

            existingDocument.Title = updatedDocument.Title;
            existingDocument.Description = updatedDocument.Description;
            existingDocument.Category = updatedDocument.Category;
            existingDocument.UpdatedAt = DateTime.UtcNow;

            var result = await _documents.ReplaceOneAsync(
                document => document.Id == id,
                existingDocument);

            return result.ModifiedCount > 0;
        }

        public async Task<bool> DeleteAsync(string id)
        {
            var result = await _documents.DeleteOneAsync(
                document => document.Id == id);

            return result.DeletedCount > 0;
        }
    }
}
