/** Builds the same pagination envelope as Laravel's paginated API resources. */
export function paginated(req, data, { page, perPage, total }) {
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const base = `${req.protocol}://${req.get("host")}${req.baseUrl}${req.path === "/" ? "" : req.path}`;
  const url = (p) => `${base}?page=${p}`;

  return {
    data,
    links: {
      first: url(1),
      last: url(lastPage),
      prev: page > 1 ? url(page - 1) : null,
      next: page < lastPage ? url(page + 1) : null,
    },
    meta: {
      current_page: page,
      last_page: lastPage,
      per_page: perPage,
      total,
      from: total === 0 ? null : (page - 1) * perPage + 1,
      to: total === 0 ? null : Math.min(page * perPage, total),
    },
  };
}
