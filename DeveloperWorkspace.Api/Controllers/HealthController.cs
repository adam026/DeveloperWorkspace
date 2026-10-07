using DeveloperWorkspace.Api.Data;
using Microsoft.AspNetCore.Mvc;

namespace DeveloperWorkspace.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HealthController : ControllerBase
    {
        private readonly MongoDbContext _mongoDbContext;

        public HealthController(MongoDbContext mongoDbContext)
        {
            _mongoDbContext = mongoDbContext;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            try
            {
                await _mongoDbContext.Database
                    .RunCommandAsync<MongoDB.Bson.BsonDocument>(
                        new MongoDB.Bson.BsonDocument("ping", 1));

                return Ok(new
                {
                    status = "OK",
                    database = "Connected"
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new
                {
                    status = "Error",
                    database = "Disconnected"
                });
            }
        }
    }
}
