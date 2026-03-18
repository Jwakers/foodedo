export const POST_TITLES_AND_SLUGS_QUERY = `*[
  _type == "post"
  && defined(slug.current)
]|order(publishedAt desc){
  title,
  "slug": slug.current
}`;

