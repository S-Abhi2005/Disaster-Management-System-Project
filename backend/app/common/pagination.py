from math import ceil

def paginate(items: list, page: int = 1, limit: int = 10):
    if page < 1:
        page = 1
    if limit < 1:
        limit = 10

    total_items = len(items)
    total_pages = ceil(total_items / limit) if limit else 1

    start = (page - 1) * limit
    end = start + limit

    return {
        "items": items[start:end],
        "meta": {
            "page": page,
            "limit": limit,
            "total_items": total_items,
            "total_pages": total_pages,
        }
    }