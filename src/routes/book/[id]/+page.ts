import type { PageLoad } from "./$types";
import { getBook } from "$lib/books";
import { error } from "@sveltejs/kit";

export const ssr = false;

export const load: PageLoad = ({ params }) => {
  const book = getBook(params.id);
  if (!book) throw error(404, "Book not found");
  return { book };
};
