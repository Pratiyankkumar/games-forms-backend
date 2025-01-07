import { PrismaClient } from "@prisma/client";
import express from "express";
import cors from "cors";

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.post("/submit", async (req, res): Promise<void> => {
  const { email, players } = req.body;

  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  try {
    // Check for existing squad with email
    const existingSquad = await prisma.squad.findFirst({
      where: {
        email: email,
      },
    });

    if (existingSquad) {
      res.status(400).json({
        error: "Email already exists",
        details: `Squad with email ${email} already exists`,
      });
      return;
    }

    // Check for existing player uIds
    const existingPlayers = await prisma.player.findMany({
      where: {
        uId: {
          in: players.map((p: { gameUid: string }) => p.gameUid),
        },
      },
      include: {
        squad: {
          select: {
            email: true,
          },
        },
      },
    });

    if (existingPlayers.length > 0) {
      const duplicates = existingPlayers.map((player) => ({
        uId: player.uId,
        existingSquadEmail: player.squad?.email || "No squad",
      }));

      res.status(400).json({
        error: "Duplicate players found",
        duplicates,
      });
      return;
    }

    // Create squad and players in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create squad first
      const newSquad = await tx.squad.create({
        data: { email },
      });

      // Create all players
      const createdPlayers = await Promise.all(
        players.map((player: { gameUid: string; name: string }) =>
          tx.player.create({
            data: {
              name: player.name,
              uId: player.gameUid,
              squadId: newSquad.id,
            },
          })
        )
      );

      return { squad: newSquad, players: createdPlayers };
    });

    res.status(200).json({
      message: "Squad and players created successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      error: "Failed to create squad and players",
      details: error?.message || "Unknown error occurred",
    });
  }
});

app.get("/getSquads", async (req, res) => {
  try {
    const squads = await prisma.squad.findMany({
      include: {
        players: {
          select: {
            id: true,
            name: true,
            uId: true,
          },
        },
      },
    });

    res.status(200).json(squads);
  } catch (error: any) {
    res.status(400).json({
      error: "Failed to fetch squads",
      details: error?.message || "Unknown error occurred",
    });
  }
});

app.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
