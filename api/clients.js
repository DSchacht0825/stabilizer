import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
});

const KEY = "stabilizer-clients";

const SEED = [
  ["Acevedo, Sergio","Caro"],["Alavez (Rodriguez), Marisol","Caro"],["Alfaro, Nancy","Caro"],
  ["Anaya, Silvia","Vanessa"],["Arias, Javier","Caro"],["Bernal, Francisco","Caro"],
  ["Bodjanac, Libusa","Vanessa"],["Bowles, William","Vanessa"],["Brant, Vanessa","Caro"],
  ["Brunett, Brittney","Alex"],["Bugiel, Steven - OLD","Reassessed"],["Bugiel, Steven - REVISED","Alex"],
  ["Burnett, David","Alex"],["Butler, Kaytlynn","Caro"],["Calderon, Khaliah","Vanessa"],
  ["Carrera, Jacinto","Caro"],["Castillo, Spencer","Alex"],["Castleman, Modena","Vanessa"],
  ["Cortez, Esteban OLD","Reassessed"],["Cortez, Esteban NEW","Vanessa"],["Davis, Diane","Caro"],
  ["Deltoro, Trino","Alex"],["Enriquez, Mariana","Vanessa"],["Exline, Teresa","Caro"],
  ["Faletogo, Demoana","Alex"],["Fauskee, Charles","Alex"],["Garcia, Georgina","Caro"],
  ["Gonzalez Mora, Omare","Vanessa"],["Goodson, Katherine NEW","Alex"],["Goodson, Katherine Old","Reassessed"],
  ["Gray, Stanley","Caro"],["Greer, Daniel","Alex"],["Greer, Dustin","Alex"],
  ["Gutierrez, Veronica","Caro"],["Hale, Frank","Vanessa"],["Harriman, Deborah","Vanessa"],
  ["Harris, Kimmely","Caro"],["Hawkins, Stephen","Caro"],["Heathman, Heather","Vanessa"],
  ["Heneise, Samuel","Vanessa"],["Isales, James","Alex"],["Jacquet, Waverly","Alex"],
  ["Jimenez, Jose","Caro"],["Johnson, Kathleen","Vanessa"],["Junkins, Shanera","Vanessa"],
  ["Kappes, Gregory Ralph","Terminated"],["Karcher, Douglas","Alex"],["Kodzik, Sara","Vanessa"],
  ["Lafayette, Kevin","Alex"],["Lopez, Monisa","Caro"],["Martinez, Bryan","Alex"],
  ["Martinez, Samuel","Alex"],["McDonald, Michael","Vanessa"],["Miles, Cynthia","Terminated"],
  ["Nares, Destynie","Vanessa"],["Nida, Wendy","Caro"],["Ochoa, Rogelio","Alex"],
  ["Paisley, Jeff","Alex"],["Perkins, Joshua","Vanessa"],["Piatek, Martin","Alex"],
  ["Quijano, Cesar","Caro"],["Quintero, Jorge","Caro"],["Quiroz, Richard","Caro"],
  ["Reed, Susan","Alex"],["Richey, Marlin","Alex"],["Romano, Daniel","Caro"],
  ["Sanchez, Jessica","Vanessa"],["Sanson, Antonio","Alex"],["Scanlon, Patrick","Vanessa"],
  ["Smith, Cynthia","Vanessa"],["Smith, Steven T.","Caro"],["Solis, Jose","Caro"],
  ["Steiner, Casandra OLD","Reassessed"],["Steiner, Cassandra NEW","Vanessa"],["Stone, Kelly","Terminated"],
  ["Taylor, Rahman","Alex"],["Tucker, Tyler","Vanessa"],["Valdez, George","Alex"],
  ["Williams, Kimberly","Caro"],["Young, Randall","Alex"]
].map(function (row, i) { return { id: "seed-" + i, name: row[0], stabilizer: row[1] }; });

const ALLOWED_STABILIZERS = new Set(["Caro", "Vanessa", "Alex", "Terminated", "Reassessed"]);

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (!process.env.KV_REST_API_URL && !process.env.UPSTASH_REDIS_REST_URL) {
    return res.status(500).json({
      error: "No Redis store connected. In the Vercel dashboard, connect a database under Storage and redeploy."
    });
  }

  if (req.method === "GET") {
    let list = await redis.get(KEY);
    if (!list) {
      list = SEED;
      await redis.set(KEY, list);
    }
    return res.status(200).json(list);
  }

  if (req.method === "PUT") {
    const body = req.body;
    if (!Array.isArray(body)) {
      return res.status(400).json({ error: "Expected a JSON array of clients" });
    }
    for (const item of body) {
      if (
        typeof item.id !== "string" ||
        typeof item.name !== "string" ||
        !item.name.trim() ||
        !ALLOWED_STABILIZERS.has(item.stabilizer)
      ) {
        return res.status(400).json({ error: "Malformed client record" });
      }
    }
    await redis.set(KEY, body);
    return res.status(200).json({ ok: true, count: body.length });
  }

  res.setHeader("Allow", "GET, PUT");
  return res.status(405).json({ error: "Method not allowed" });
}
