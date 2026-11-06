from datetime import datetime

def soft_delete(entity: dict):
    entity["is_deleted"] = True
    entity["deleted_at"] = datetime.utcnow()

def archive(entity: dict):
    entity["archived_at"] = datetime.utcnow()
