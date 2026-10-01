import os
from datetime import datetime

from sqlalchemy import (
    create_engine,
    Column,
    String,
    Text,
    Integer,
    Float,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship


DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./botops.db")
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    connect_args=connect_args,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class ProjectDB(Base):
    __tablename__ = "projects"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(Text, default="")


class TestCaseDB(Base):
    __tablename__ = "test_cases"
    id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.id"), index=True, nullable=False)
    test_case_id = Column(String, nullable=False)
    category = Column(String, default="General")
    question = Column(Text, nullable=False)
    expected = Column(Text, nullable=False)
    evaluation_type = Column(String, default="AI Judge")


class BotConfigDB(Base):
    __tablename__ = "bot_configs"
    project_id = Column(String, ForeignKey("projects.id"), primary_key=True)
    mode = Column(String, default="mock")
    api_url = Column(Text, default="")
    method = Column(String, default="POST")
    headers_json = Column(Text, default="{}")
    payload_template_json = Column(Text, default="{}")
    response_path = Column(String, default="response")
    judge_mode = Column(String, default="local")


class TestRunDB(Base):
    __tablename__ = "test_runs"
    id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.id"), index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    total = Column(Integer, default=0)
    passed = Column(Integer, default=0)
    partial = Column(Integer, default=0)
    failed = Column(Integer, default=0)
    errors = Column(Integer, default=0)
    pass_rate = Column(Float, default=0)
    avg_response_time_ms = Column(Integer, default=0)
    results = relationship("TestResultDB", back_populates="run", cascade="all, delete-orphan")


class TestResultDB(Base):
    __tablename__ = "test_results"
    id = Column(String, primary_key=True)
    run_id = Column(String, ForeignKey("test_runs.id"), index=True, nullable=False)
    test_case_id = Column(String, nullable=False)
    question = Column(Text, nullable=False)
    expected = Column(Text, nullable=False)
    actual = Column(Text, default="")
    status = Column(String, nullable=False)
    score = Column(Float, default=0)
    reason = Column(Text, default="")
    response_time_ms = Column(Integer, default=0)
    run = relationship("TestRunDB", back_populates="results")


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class ScenarioDB(Base):
    __tablename__ = "scenarios"
    id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.id"), index=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    steps = relationship("ScenarioStepDB", back_populates="scenario", cascade="all, delete-orphan", order_by="ScenarioStepDB.step_order")


class ScenarioStepDB(Base):
    __tablename__ = "scenario_steps"
    id = Column(String, primary_key=True)
    scenario_id = Column(String, ForeignKey("scenarios.id"), index=True, nullable=False)
    step_order = Column(Integer, nullable=False)
    user_message = Column(Text, nullable=False)
    expected = Column(Text, nullable=False)
    evaluation_type = Column(String, default="AI Judge")
    scenario = relationship("ScenarioDB", back_populates="steps")


class ScenarioRunDB(Base):
    __tablename__ = "scenario_runs"
    id = Column(String, primary_key=True)
    scenario_id = Column(String, ForeignKey("scenarios.id"), index=True, nullable=False)
    project_id = Column(String, ForeignKey("projects.id"), index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    status = Column(String, nullable=False)
    total_steps = Column(Integer, default=0)
    passed_steps = Column(Integer, default=0)
    failed_step = Column(Integer, nullable=True)
    results_json = Column(Text, default="[]")


class RequirementDB(Base):
    __tablename__ = "requirements"
    id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.id"), index=True, nullable=False)
    title = Column(String, nullable=False)
    raw_requirement = Column(Text, nullable=False)
    analysis_json = Column(Text, default="{}")
    flow_mermaid = Column(Text, default="")
    prompt_text = Column(Text, default="")
    generated_tests_json = Column(Text, default="[]")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class FlowDesignDB(Base):
    __tablename__ = "flow_designs"
    id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.id"), index=True, nullable=False)
    name = Column(String, nullable=False)
    nodes_json = Column(Text, default="[]")
    edges_json = Column(Text, default="[]")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, index=True)


class PromptVersionDB(Base):
    __tablename__ = "prompt_versions"
    id = Column(String, primary_key=True)
    project_id = Column(String, ForeignKey("projects.id"), index=True, nullable=False)
    name = Column(String, nullable=False)
    version = Column(Integer, nullable=False)
    prompt_text = Column(Text, nullable=False)
    source = Column(String, default="manual")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
