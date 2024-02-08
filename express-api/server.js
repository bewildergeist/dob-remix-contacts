// Imports
import express from "express";
import cors from "cors";
import morgan from "morgan";
import db from "./database.js";
import { ObjectId } from "mongodb";

// ========== Setup ========== //

// Create Express app
const server = express();
const PORT = process.env.PORT;

// Configure middleware
server.use(express.json()); // To parse JSON bodies
server.use(cors()); // Enable CORS for all routes
server.use(process.env.NODE_ENV === "production" ? morgan("tiny") : morgan("dev")); // Log HTTP requests in production or development

// Pretty print JSON
server.set("json spaces", 2);

// ========== Routes ========== //

// Root route
server.get("/", (req, res) => {
    res.send("Node.js REST API with Express.js");
});

// Get all contacts (GET /contacts)
server.get("/contacts", async (req, res) => {
    const contacts = await db
        .collection("contacts") // Get the contacts collection from the database
        .find() // Get all contacts from database
        .sort({ first: 1, last: 1 }) // Sort by first name, then last name
        .toArray(); // Get all contacts from database
    res.json(contacts); // Send the results as JSON
});

// Search contacts (GET /contacts/search?q=)
server.get("/contacts/search", async (req, res) => {
    const searchString = req.query.q.toLowerCase(); // get query string from request URL and lowercase it
    const query = {
        $or: [
            { first: { $regex: searchString, $options: "i" } },
            { last: { $regex: searchString, $options: "i" } },
        ],
    }; // MongoDB query

    const results = await db
        .collection("contacts") // Get the contacts collection from the database
        .find(query) // Find contacts matching query
        .sort({ first: 1, last: 1 }) // Sort by first name, then last name
        .toArray(); // Execute the query

    res.json(results); // Send the results as JSON
});

// Get single contact (GET /contacts/:id)
server.get("/contacts/:id", async (req, res) => {
    const id = req.params.id; // get id from request URL

    try {
        const objectId = new ObjectId(id); // create ObjectId from id
        const contact = await db
            .collection("contacts")
            .findOne({ _id: objectId }); // Get contact from database

        if (contact) {
            res.json(contact); // return first contact from results as JSON
        } else {
            res.status(404).json({ message: "Contact not found" }); // otherwise return 404 and error message
        }
    } catch (error) {
        res.status(400).json({ message: "Invalid ObjectId" }); // return 400 and error message for invalid ObjectId
    }
});

// Create contact (POST /contacts)
server.post("/contacts", async (req, res) => {
    const newContact = req.body; // get new contact object from request body

    const result = await db.collection("contacts").insertOne(newContact); // Insert new contact into database

    if (result.acknowledged) {
        res.json({ message: "Created new contact", _id: result.insertedId }); // return message and id of new contact
    } else {
        res.status(500).json({ message: "Failed to create new contact" }); // return error message
    }
});

// Update contact (PUT /contacts/:id)
server.put("/contacts/:id", async (req, res) => {
    const id = req.params.id; // get id from request URL
    try {
        const objectId = new ObjectId(id); // create ObjectId from id
        const updatedContact = req.body; // get updated properties from request body
        const result = await db
            .collection("contacts")
            .updateOne({ _id: objectId }, { $set: updatedContact }); // Update contact in database

        if (result.acknowledged) {
            res.json({ message: `Updated contact with id ${id}` }); // return message
        } else {
            res.status(500).json({ message: "Failed to update contact" }); // return error message
        }
    } catch (error) {
        res.status(400).json({ message: "Invalid ObjectId" }); // return 400 and error message for invalid ObjectId
    }
});

// Delete contact (DELETE /contacts/:id)
server.delete("/contacts/:id", async (req, res) => {
    const id = req.params.id; // get id from request URL

    try {
        const objectId = new ObjectId(id); // create ObjectId from id
        const result = await db
            .collection("contacts")
            .deleteOne({ _id: objectId }); // Delete contact from database

        if (result.acknowledged) {
            res.json({ message: `Deleted contact with id ${id}` }); // return message
        } else {
            res.status(500).json({ message: "Failed to delete contact" }); // return error message
        }
    } catch (error) {
        res.status(400).json({ message: "Invalid ObjectId" }); // return 400 and error message for invalid ObjectId
    }
});

// Toggle favorite property of contact (PUT /contacts/:id/favorite)
server.patch("/contacts/:id/favorite", async (req, res) => {
    const id = req.params.id; // get id from request URL

    try {
        const objectId = new ObjectId(id); // create ObjectId from id
        const contact = await db
            .collection("contacts")
            .findOne({ _id: objectId }); // Get the contact from the database

        if (contact) {
            const newFavoriteValue = !contact.favorite; // Toggle the favorite field
            // Update the contact in the database
            await db
                .collection("contacts")
                .updateOne(
                    { _id: objectId },
                    { $set: { favorite: newFavoriteValue } }
                );

            res.json({
                message: `Toggled favorite property of contact with id ${id}`,
            }); // return message
        } else {
            res.status(404).json({ message: "Contact not found" }); // return 404 if contact was not found
        }
    } catch (error) {
        res.status(400).json({ message: "Invalid ObjectId" }); // return 400 and error message for invalid ObjectId
    }
});

// Create a new note on a contact (POST /contacts/:id/notes)
server.post("/contacts/:id/notes", async (req, res) => {
    const id = req.params.id; // get id from request URL

    try {
        const objectId = new ObjectId(id); // create ObjectId from id
        const note = req.body; // get note object from request body
        const result = await db
            .collection("contacts")
            .updateOne(
                { _id: objectId },
                { $push: { notes: note } }
            ); // Add note to contact in database

        if (result.acknowledged) {
            res.json({ message: `Added note to contact with id ${id}` }); // return message
        } else {
            res.status(500).json({ message: "Failed to add note to contact" }); // return error message
        }
    } catch (error) {
        res.status(400).json({ message: "Invalid ObjectId" }); // return 400 and error message for invalid ObjectId
    }
});

// Retrieve a single note from a contact (GET /contacts/:contactId/notes/:noteIndex)
server.get("/contacts/:contactId/notes/:noteIndex", async (req, res) => {
    const contactId = req.params.contactId; // get contactId from request URL
    const noteIndex = parseInt(req.params.noteIndex); // get noteIndex from request URL and parse it as an integer

    try {
        const objectId = new ObjectId(contactId); // create ObjectId from contactId
        const contact = await db
            .collection("contacts")
            .findOne({ _id: objectId }); // Get the contact from the database

        if (contact) {
            const note = contact.notes[noteIndex];
            if (!note) {
                res.status(404).json({ message: "Note not found" });
            }
            res.json(note);
        } else {
            res.status(404).json({ message: "Contact not found" });
        }
    } catch (error) {
        res.status(400).json({ message: "Invalid ObjectId" }); // return 400 and error message for invalid ObjectId
    }
});

// ========== Start server ========== //

// Start server on whatever port is set in the environment variable PORT
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
