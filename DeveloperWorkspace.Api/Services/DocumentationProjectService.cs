using DeveloperWorkspace.Api.Data;
using DeveloperWorkspace.Api.Models;
using MongoDB.Driver;

namespace DeveloperWorkspace.Api.Services
{
    public class DocumentationProjectService
    {
        private readonly IMongoCollection<DocumentationProject> _projects;

        public DocumentationProjectService(MongoDbContext context)
        {
            _projects = context.Database
                .GetCollection<DocumentationProject>("documentationProjects");
        }

        public async Task<List<DocumentationProject>> GetAllAsync()
        {
            return await _projects
                .Find(_ => true)
                .SortByDescending(project => project.CreatedAt)
                .ToListAsync();
        }

        public async Task<DocumentationProject?> GetByIdAsync(string id)
        {
            return await _projects
                .Find(project => project.Id == id)
                .FirstOrDefaultAsync();
        }

        public async Task<DocumentationProject> CreateAsync(
            DocumentationProject project)
        {
            project.Id = null;
            project.CreatedAt = DateTime.UtcNow;
            project.UpdatedAt = null;

            await _projects.InsertOneAsync(project);

            return project;
        }

        public async Task<bool> UpdateAsync(
            string id,
            DocumentationProject updatedProject)
        {
            var existingProject = await GetByIdAsync(id);

            if (existingProject is null)
            {
                return false;
            }

            existingProject.Name = updatedProject.Name;
            existingProject.Description = updatedProject.Description;
            existingProject.Technologies = updatedProject.Technologies;
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
