import {
  Form,
  Links,
  LiveReload,
  Meta,
  NavLink,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import { useEffect } from "react";
import appStylesHref from "./app.css"
import tailwindStylesHref from "./tailwind.css"

export function links() {
  return [{ rel: "stylesheet", href: tailwindStylesHref }, { rel: "stylesheet", href: appStylesHref }];
}

export async function loader({ request }) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  
  let apiUrl = process.env.API_URL + "/contacts";
  if (q) {
    apiUrl += "/search?q=" + encodeURIComponent(q);
  }
  const res = await fetch(apiUrl);
  if (!res.ok) {
    throw new Error("Failed to load contacts");
  }
  const contacts = await res.json();
  return json({ contacts, q });
}

export default function App() {
  const { contacts, q } = useLoaderData();
  const navigation = useNavigation();
  const submit = useSubmit();

  useEffect(() => {
    const searchField = document.getElementById("q");
    if (searchField instanceof HTMLInputElement) {
      searchField.value = q || "";
    }
  }, [q]);

  const searching = navigation.location && new URLSearchParams(navigation.location.search).has("q");

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <div id="sidebar">
          <h1>Remix Contacts</h1>
          <div>
            <Form id="search-form" role="search" onChange={
              (event) => {
                const isFirstSearch = q === null;
                submit(event.currentTarget, {
                  replace: !isFirstSearch,
                })
              }}>
              <input
                id="q"
                aria-label="Search contacts"
                placeholder="Search"
                type="search"
                defaultValue={q || ""}
                name="q"
                className={searching ? "loading" : ""}
              />
              <div id="search-spinner" aria-hidden hidden={!searching} />
            </Form>
            <Form method="post">
              <button type="submit">New</button>
            </Form>
          </div>
          <nav>
            {contacts.length ? (
              <ul>
                {contacts.map((contact) => (
                  <li key={contact._id}>
                    <NavLink to={`contacts/${contact._id}`} className={({ isActive, isPending }) => {
                      return isActive ? "active" : isPending ? "pending" : ""
                    }}>
                      {contact.first || contact.last ? (
                        <>
                          {contact.first} {contact.last}
                        </>
                      ) : (
                        <i>No Name</i>
                      )}{" "}
                      {contact.favorite ? (
                        <span>★</span>
                      ) : null}
                    </NavLink>
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                <i>No contacts</i>
              </p>
            )}
          </nav>
        </div>
        <div id="detail" className={navigation.state === "loading" && !searching ? "loading" : ""}>
          <Outlet />
        </div>

        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

export async function action() {
  const response = await fetch(process.env.API_URL + "/contacts", {
    method: "POST",
    body: JSON.stringify({}),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  const contact = await response.json();
  return redirect(`/contacts/${contact._id}/edit`)
}