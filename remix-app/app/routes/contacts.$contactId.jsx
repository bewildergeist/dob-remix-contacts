import { Form, json, useFetcher, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";

export async function loader({ params }) {
  invariant(params.contactId, "Missing contactId param");
  const response = await fetch(
    process.env.API_URL + "/contacts/" + params.contactId,
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Response(error.message, { status: response.status });
  }
  const contact = await response.json();
  return json({ contact });
}

export default function Contact() {
  const { contact } = useLoaderData();

  return (
    <div>
      <div id="contact">
        <div>
          <img
            alt={`${contact.first} ${contact.last} avatar`}
            key={contact.avatar}
            src={contact.avatar}
          />
        </div>

        <div>
          <h1>
            {contact.first || contact.last ? (
              <>
                {contact.first} {contact.last}
              </>
            ) : (
              <i>No Name</i>
            )}{" "}
            <Favorite contact={contact} />
          </h1>

          {contact.twitter ? (
            <p>
              <a href={`https://twitter.com/${contact.twitter}`}>
                {contact.twitter}
              </a>
            </p>
          ) : null}
          <div>
            <Form action="edit">
              <button type="submit">Edit</button>
            </Form>

            <Form
              action="destroy"
              method="post"
              onSubmit={(event) => {
                const response = confirm(
                  "Please confirm you want to delete this record.",
                );
                if (!response) {
                  event.preventDefault();
                }
              }}
            >
              <button type="submit">Delete</button>
            </Form>
          </div>
        </div>
      </div>
      <h2 className="mb-3 mt-4 text-2xl font-bold">Notes</h2>
      <Form method="post" className="flex flex-row items-center gap-3">
        <input
          type="text"
          className="mb-0 flex-grow rounded border border-gray-300 p-2"
          placeholder={`New note about ${contact.first}`}
          name="note"
        />
        <button type="submit">Save</button>
      </Form>
      {contact.notes?.length > 0 && (
        <ul>
          {contact.notes.map((note, index) => (
            <li key={index} className="border-b border-gray-200">
              <p className="py-3">{note}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export async function action({ params }) {
  invariant(params.contactId, "Missing contactId param");
  const response = await fetch(
    process.env.API_URL + "/contacts/" + params.contactId + "/favorite",
    {
      method: "PATCH",
    },
  );
  if (!response.ok) {
    throw new Error("Failed to update favorite");
  }
  return null;
}

function Favorite({ contact }) {
  const fetcher = useFetcher();
  const favorite = fetcher.formData
    ? fetcher.formData.get("favorite") === "true"
    : contact.favorite;

  return (
    <fetcher.Form method="post">
      <button
        aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
        name="favorite"
        value={favorite ? "false" : "true"}
      >
        {favorite ? "★" : "☆"}
      </button>
    </fetcher.Form>
  );
}
