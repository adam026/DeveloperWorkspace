using DeveloperWorkspace.Api.Data;
using DeveloperWorkspace.Api.Models;
using MongoDB.Driver;

namespace DeveloperWorkspace.Api.Services
{
    public class ArchitectureProjectService
    {
        private readonly IMongoCollection<ArchitectureProject> _projects;

        public ArchitectureProjectService(MongoDbContext context)
        {
            _projects = context.Database
                .GetCollection<ArchitectureProject>("architectureProjects");
        }

        public async Task<List<ArchitectureProject>> GetAllAsync()
        {
            return await _projects
                .Find(_ => true)
                .SortByDescending(project => project.CreatedAt)
                .ToListAsync();
        }

        public async Task<ArchitectureProject?> GetByIdAsync(string id)
        {
            return await _projects
                .Find(project => project.Id == id)
                .FirstOrDefaultAsync();
        }

        public async Task<ArchitectureProject> CreateAsync(
            ArchitectureProject project)
        {
            project.Id = null;
            project.CreatedAt = DateTime.UtcNow;
            project.UpdatedAt = null;

            await _projects.InsertOneAsync(project);

            return project;
        }

        public async Task<bool> UpdateAsync(
            string id,
            ArchitectureProject updatedProject)
        {
            var existingProject = await GetByIdAsync(id);

            if (existingProject is null)
            {
                return false;
            }

            existingProject.Name = updatedProject.Name;
            existingProject.Description = updatedProject.Description;
            existingProject.Components = updatedProject.Components;
            existingProject.Connections = updatedProject.Connections;
            existingProject.UpdatedAt = DateTime.UtcNow;

            var result = await _projects.ReplaceOneAsync(
                project => project.Id == id,
                existingProject);

            return result.MatchedCount > 0;
        }

        public async Task<bool> DeleteAsync(string id)
        {
            var result = await _projects.DeleteOneAsync(
                project => project.Id == id);

            return result.DeletedCount > 0;
        }
    }
}

