def filter_by_field(items: list, field: str, value):
    if value is None:
        return items
    return [item for item in items if item.get(field) == value]

def filter_by_date(items: list, field: str, from_date=None, to_date=None):
    if not from_date and not to_date:
        return items

    result = []
    for item in items:
        item_date = item.get(field)
        if not item_date:
            continue

        if from_date and item_date < from_date:
            continue
        if to_date and item_date > to_date:
            continue

        result.append(item)
    return result

def visible(items: list):
    return [
        i for i in items
        if not i.get("is_deleted") and not i.get("archived_at")
    ]
