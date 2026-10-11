
using DeveloperWorkspace.Api.Data;
using DeveloperWorkspace.Api.Models;
using MongoDB.Driver;

namespace DeveloperWorkspace.Api.Services;

public class PromptService
{
    private readonly IMongoCollection<Prompt> _prompts;

    public PromptService(MongoDbContext context)
    {
        _prompts = context.Database
            .GetCollection<Prompt>("prompts");
    }

    public async Task<List<Prompt>> GetAllAsync()
    {
        return await _prompts
            .Find(_ => true)
            .SortByDescending(prompt => prompt.CreatedAt)
            .ToListAsync();
    }

    public async Task<Prompt?> GetByIdAsync(string id)
    {
        return await _prompts
            .Find(prompt => prompt.Id == id)
            .FirstOrDefaultAsync();
    }

    public async Task<Prompt> CreateAsync(Prompt prompt)
    {
        prompt.Id = null;
        prompt.CreatedAt = DateTime.UtcNow;
        prompt.UpdatedAt = null;

        await _prompts.InsertOneAsync(prompt);

        return prompt;
    }

    public async Task<bool> UpdateAsync(string id, Prompt updatedPrompt)
    {
        var existingPrompt = await GetByIdAsync(id);

        if (existingPrompt is null)
        {
            return false;
        }

        existingPrompt.Title = updatedPrompt.Title;
        existingPrompt.Description = updatedPrompt.Description;
        existingPrompt.Category = updatedPrompt.Category;
        existingPrompt.Content = updatedPrompt.Content;
        existingPrompt.UpdatedAt = DateTime.UtcNow;

        var result = await _prompts.ReplaceOneAsync(
            prompt => prompt.Id == id,
            existingPrompt);

        return result.MatchedCount > 0;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var result = await _prompts.DeleteOneAsync(
            prompt => prompt.Id == id);

        return result.DeletedCount > 0;
    }
}

