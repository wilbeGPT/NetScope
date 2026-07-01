from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime, timezone

Base = declarative_base()

class Investigation(Base):
    __tablename__ = "investigations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    raw_json_path = Column(String)

class PhaseResult(Base):
    __tablename__ = "phase_results"
    
    id = Column(Integer, primary_key=True, index=True)
    investigation_id = Column(Integer, index=True)
    phase_number = Column(Integer, index=True)
    result_json = Column(Text) # JSON serialized PhaseResponse
    executed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class IPGeolocationCache(Base):
    __tablename__ = "ip_geolocation_cache"
    
    id = Column(Integer, primary_key=True, index=True)
    ip = Column(String, unique=True, index=True)
    country = Column(String)
    country_code = Column(String)
    owner = Column(String)
    category = Column(String) # local | regional | backbone
    fetched_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
