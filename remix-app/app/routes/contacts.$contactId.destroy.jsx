import { redirect } from "@remix-run/node";
import invariant from "tiny-invariant";

export async function action({ params }) {
  invariant(params.contactId, "Missing contactId param");
  const response = await fetch(process.env.API_URL + "/contacts/" + params.contactId, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Response(error.message, { status: response.status });
  }
  return redirect("/");
}