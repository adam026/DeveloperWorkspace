
using DeveloperWorkspace.Api.Data;
using DeveloperWorkspace.Api.Models;
using MongoDB.Driver;

namespace DeveloperWorkspace.Api.Services;

public class MarkdownDocumentService
{
    private readonly IMongoCollection<MarkdownDocument> _documents;

    public MarkdownDocumentService(MongoDbContext context)
    {
        _documents = context.Database
            .GetCollection<MarkdownDocument>("markdownDocuments");
    }

    public async Task<List<MarkdownDocument>> GetAllAsync()
    {
        return await _documents
            .Find(_ => true)
            .SortByDescending(document => document.CreatedAt)
            .ToListAsync();
    }

    public async Task<MarkdownDocument?> GetByIdAsync(string id)
    {
        return await _documents
            .Find(document => document.Id == id)
            .FirstOrDefaultAsync();
    }

    public async Task<MarkdownDocument> CreateAsync(
        MarkdownDocument document)
    {
        document.Id = null;
        document.CreatedAt = DateTime.UtcNow;
        document.UpdatedAt = null;

        await _documents.InsertOneAsync(document);

        return document;
    }

    public async Task<bool> UpdateAsync(
        string id,
        MarkdownDocument updatedDocument)
    {
        updatedDocument.Id = id;
        updatedDocument.UpdatedAt = DateTime.UtcNow;

        var result = await _documents.ReplaceOneAsync(
            document => document.Id == id,
            updatedDocument);

        return result.MatchedCount > 0;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var result = await _documents.DeleteOneAsync(
            document => document.Id == id);

        return result.DeletedCount > 0;
    }
}

