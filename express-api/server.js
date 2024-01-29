// Imports
import express from "express";
import cors from "cors";
import db from "./database.js";
import { ObjectId } from "mongodb";

// ========== Setup ========== //

// Create Express app
const server = express();
const PORT = process.env.PORT;

// Configure middleware
server.use(express.json()); // to parse JSON bodies
server.use(cors()); // Enable CORS for all routes

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
            { last: { $regex: searchString, $options: "i" } }
        ]
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
    const contact = await db
        .collection("contacts")
        .findOne({ _id: new ObjectId(id) }); // Get contact from database

    if (contact) {
        res.json(contact); // return first contact from results as JSON
    } else {
        res.status(404).json({ message: "Contact not found!" }); // otherwise return 404 and error message
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
    const updatedContact = req.body; // get updated properties from request body
    const result = await db
        .collection("contacts")
        .updateOne({ _id: new ObjectId(id) }, { $set: updatedContact }); // Update contact in database

    if (result.acknowledged) {
        res.json({ message: `Updated contact with id ${id}` }); // return message
    } else {
        res.status(500).json({ message: "Failed to update contact" }); // return error message
    }
});

// Delete contact (DELETE /contacts/:id)
server.delete("/contacts/:id", async (req, res) => {
    const id = req.params.id; // get id from request URL

    const result = await db
        .collection("contacts")
        .deleteOne({ _id: new ObjectId(id) }); // Delete contact from database

    if (result.acknowledged) {
        res.json({ message: `Deleted contact with id ${id}` }); // return message
    } else {
        res.status(500).json({ message: "Failed to delete contact" }); // return error message
    }
});

// Toggle favorite property of contact (PUT /contacts/:id/favorite)
server.patch("/contacts/:id/favorite", async (req, res) => {
    const id = req.params.id; // get id from request URL

    const contact = await db
        .collection("contacts")
        .findOne({ _id: new ObjectId(id) }); // Get the contact from the database

    if (contact) {
        const newFavoriteValue = !contact.favorite; // Toggle the favorite field
        // Update the contact in the database
        await db
            .collection("contacts")
            .updateOne(
                { _id: new ObjectId(id) },
                { $set: { favorite: newFavoriteValue } }
            );

        res.json({
            message: `Toggled favorite property of contact with id ${id}`
        }); // return message
    } else {
        res.status(404).json({ message: "Contact not found!" }); // return 404 if contact was not found
    }
});

// ========== Start server ========== //

// Start server on whatever port is set in the environment variable PORT
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
