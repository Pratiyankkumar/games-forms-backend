"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.post("/submit", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, players } = req.body;
    if (!email) {
        res.status(400).json({ error: "Email is required" });
        return;
    }
    try {
        // Check for existing squad with email
        const existingSquad = yield prisma.squad.findFirst({
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
        const existingPlayers = yield prisma.player.findMany({
            where: {
                uId: {
                    in: players.map((p) => p.gameUid),
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
            const duplicates = existingPlayers.map((player) => {
                var _a;
                return ({
                    uId: player.uId,
                    existingSquadEmail: ((_a = player.squad) === null || _a === void 0 ? void 0 : _a.email) || "No squad",
                });
            });
            res.status(400).json({
                error: "Duplicate players found",
                duplicates,
            });
            return;
        }
        // Create squad and players in a transaction
        const result = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // Create squad first
            const newSquad = yield tx.squad.create({
                data: { email },
            });
            // Create all players
            const createdPlayers = yield Promise.all(players.map((player) => tx.player.create({
                data: {
                    name: player.name,
                    uId: player.gameUid,
                    squadId: newSquad.id,
                },
            })));
            return { squad: newSquad, players: createdPlayers };
        }));
        res.status(200).json({
            message: "Squad and players created successfully",
            data: result,
        });
    }
    catch (error) {
        res.status(400).json({
            error: "Failed to create squad and players",
            details: (error === null || error === void 0 ? void 0 : error.message) || "Unknown error occurred",
        });
    }
}));
app.get("/getSquads", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const squads = yield prisma.squad.findMany({
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
    }
    catch (error) {
        res.status(400).json({
            error: "Failed to fetch squads",
            details: (error === null || error === void 0 ? void 0 : error.message) || "Unknown error occurred",
        });
    }
}));
app.get("/health", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Test database connection
        yield prisma.$queryRaw `SELECT 1`;
        res
            .status(200)
            .json({ status: "healthy", message: "Database connection successful" });
    }
    catch (error) {
        res
            .status(500)
            .json({ status: "unhealthy", message: "Database connection failed" });
    }
}));
app.listen(3000, () => {
    console.log("Server is listening on port 3000");
});
