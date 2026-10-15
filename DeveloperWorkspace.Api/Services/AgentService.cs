
using DeveloperWorkspace.Api.Models;
using MongoDB.Driver;

namespace DeveloperWorkspace.Api.Services;

public class AgentService
{
    private readonly IMongoCollection<Agent> _agents;

    public AgentService(IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("MongoDb")
            ?? throw new InvalidOperationException(
                "A MongoDB kapcsolati karakterlánc nem található.");

        var databaseName = configuration["MongoDb:DatabaseName"]
            ?? throw new InvalidOperationException(
                "A MongoDB adatbázis neve nem található.");

        var client = new MongoClient(connectionString);
        var database = client.GetDatabase(databaseName);

        _agents = database.GetCollection<Agent>("agents");
    }

    public async Task<List<Agent>> GetAllAsync()
    {
        return await _agents
            .Find(_ => true)
            .SortByDescending(agent => agent.CreatedAt)
            .ToListAsync();
    }

    public async Task<Agent?> GetByIdAsync(string id)
    {
        return await _agents
            .Find(agent => agent.Id == id)
            .FirstOrDefaultAsync();
    }

    public async Task<Agent> CreateAsync(Agent agent)
    {
        agent.Id = null;
        agent.CreatedAt = DateTime.UtcNow;
        agent.UpdatedAt = null;

        await _agents.InsertOneAsync(agent);

        return agent;
    }

    public async Task<bool> UpdateAsync(string id, Agent updatedAgent)
    {
        updatedAgent.Id = id;
        updatedAgent.UpdatedAt = DateTime.UtcNow;

        var result = await _agents.ReplaceOneAsync(
            agent => agent.Id == id,
            updatedAgent);

        return result.MatchedCount > 0;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var result = await _agents.DeleteOneAsync(
            agent => agent.Id == id);

        return result.DeletedCount > 0;
    }
}
