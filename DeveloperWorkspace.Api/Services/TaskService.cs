using DeveloperWorkspace.Api.Data;
using MongoDB.Driver;
using TaskModel = DeveloperWorkspace.Api.Models.Task;

namespace DeveloperWorkspace.Api.Services;

public class TaskService
{
    private readonly IMongoCollection<TaskModel> _tasks;

    public TaskService(MongoDbContext context)
    {
        _tasks = context.Database
            .GetCollection<TaskModel>("tasks");
    }

    public async Task<List<TaskModel>> GetAllAsync()
    {
        return await _tasks
            .Find(_ => true)
            .ToListAsync();
    }

    public async Task<TaskModel?> GetByIdAsync(string id)
    {
        return await _tasks
            .Find(task => task.Id == id)
            .FirstOrDefaultAsync();
    }

    public async Task<List<TaskModel>> GetByProjectIdAsync(string projectId)
    {
        return await _tasks
            .Find(task => task.ProjectId == projectId)
            .ToListAsync();
    }

    public async Task<TaskModel> CreateAsync(TaskModel task)
    {
        task.Id = null;
        task.CreatedAt = DateTime.UtcNow;
        task.UpdatedAt = null;
        task.CompletedAt = null;

        await _tasks.InsertOneAsync(task);

        return task;
    }

    public async Task<bool> UpdateAsync(string id, TaskModel updatedTask)
    {
        var existingTask = await GetByIdAsync(id);

        if (existingTask is null)
        {
            return false;
        }

        existingTask.Title = updatedTask.Title;
        existingTask.Description = updatedTask.Description;
        existingTask.Status = updatedTask.Status;
        existingTask.Priority = updatedTask.Priority;
        existingTask.ProjectId = updatedTask.ProjectId;
        existingTask.DueDate = updatedTask.DueDate;
        existingTask.Tags = updatedTask.Tags ?? [];

        if (updatedTask.Status == "Done")
        {
            existingTask.CompletedAt ??= DateTime.UtcNow;
        }
        else
        {
            existingTask.CompletedAt = null;
        }

        existingTask.UpdatedAt = DateTime.UtcNow;

        var result = await _tasks.ReplaceOneAsync(
            task => task.Id == id,
            existingTask);

        return result.MatchedCount > 0;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var result = await _tasks.DeleteOneAsync(
            task => task.Id == id);

        return result.DeletedCount > 0;
    }
}