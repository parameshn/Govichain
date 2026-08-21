import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect
from sqlalchemy import text

from .database import Base, engine
from .routers import auth, dashboard, milestone, milestones, projects, users, public

app = FastAPI(
    title="Govichain API",
    description="Government Project Monitoring System",
    version="1.0.0",
)


BLOCKCHAIN_COLUMN_MIGRATIONS = {
    "projects": {
        "wallet_address": "VARCHAR(255)",
        "on_chain_tx_hash": "VARCHAR(255)",
        "chain_network": "VARCHAR(100)",
        "chain_id": "INTEGER",
        "chain_project_id": "INTEGER",
        "contract_address": "VARCHAR(255)",
    },
    "milestones": {
        "wallet_address": "VARCHAR(255)",
        "submission_tx_hash": "VARCHAR(255)",
        "review_tx_hash": "VARCHAR(255)",
        "chain_network": "VARCHAR(100)",
        "chain_id": "INTEGER",
        "chain_project_id": "INTEGER",
        "chain_milestone_id": "INTEGER",
        "contract_address": "VARCHAR(255)",
        "description_hash": "VARCHAR(255)",
    },
}


def run_column_migrations() -> None:
    inspector = inspect(engine)

    with engine.begin() as connection:
        for table_name, columns in BLOCKCHAIN_COLUMN_MIGRATIONS.items():
            existing_columns = {
                column["name"]
                for column in inspector.get_columns(table_name)
            }
            for column_name, column_type in columns.items():
                if column_name in existing_columns:
                    continue
                connection.execute(
                    text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}")
                )
                print(f"Added column {table_name}.{column_name}")


@app.on_event("startup")
def startup_event():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        print("Database connected successfully")

        Base.metadata.create_all(bind=engine)
        print("Database tables verified/created")
        run_column_migrations()
        print("Database optional columns verified")

    except Exception as exc:
        print("\nERROR: Cannot connect to PostgreSQL database.")
        print("Please ensure PostgreSQL server is running.")
        print(f"Details: {str(exc)}\n")
        sys.exit(1)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(milestones.router)
app.include_router(users.router)
app.include_router(dashboard.router)
app.include_router(milestone.router)
app.include_router(public.router)


@app.get("/")
def root():
    return {"message": "Welcome to Govichain API"}


@app.get("/health")
def health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception:
        return {"status": "unhealthy", "database": "disconnected"}
