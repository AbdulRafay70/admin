// Clear all cache related to branches and organizations
// Run this in the browser console to force refresh the data

console.log("Clearing cache...");

// Clear all cache keys
localStorage.removeItem("branches_cache");
localStorage.removeItem("organizations_cache");
localStorage.removeItem("last_fetched_time");
localStorage.removeItem("partners_cache");
localStorage.removeItem("partners_cache_timestamp");
localStorage.removeItem("agencies_cache");
localStorage.removeItem("agencies_cache_timestamp");
localStorage.removeItem("groups_cache");
localStorage.removeItem("groups_cache_timestamp");
localStorage.removeItem("branches_cache_timestamp");
localStorage.removeItem("organizations_cache_timestamp");

console.log("✅ Cache cleared! Please refresh the page.");
console.log("You can now create branches and the organization dropdown will show: saer.pk (ORG-0001)");
