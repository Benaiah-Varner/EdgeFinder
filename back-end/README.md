# Edge Finder Backend

Backend service for the Edge Finder application, providing financial data analysis and trading insights.

## Overview

This project is a research-driven backend for systematically evaluating trading strategies. It is designed to support data science experimentation, hypothesis testing, and walk-forward backtesting of technical setups, with a focus on understanding when and why certain strategies exhibit edge.

## Project Structure

### `backtester/`
**Data Science Experimental/Research Scripts**

The `backtester/` folder contains Jupyter notebooks and scripts designed for data science research and experimentation. These tools are used to identify cause and effect relationships between technical setups and trade outcomes. The notebooks include:

- `ds_research.ipynb` - Data science research notebook for analyzing trading patterns
- `backtester.ipynb` - Backtesting implementation for strategy validation
- `ingest_data.ipynb` - Data ingestion and preprocessing scripts
- `data/` - Historical market data (SPY 5-minute and hourly data)

These research scripts help discover statistical relationships between technical indicators, entry/exit conditions, and resulting trade performance.

### `screener/`
Stock screening tools for filtering stocks based on technical and fundamental criteria.

### `riskcalculator/`
Risk management and position sizing logic, including ATR-based stops and R-normalized sizing.

### `main.py`
FastAPI application exposing REST endpoints for screening and backtesting functionality, intended for integration with front-end tools or automated workflows.

## Setup

1. Install dependencies:
```bash
poetry install
```

2. Run the development server:
```bash
poetry run uvicorn main:app --reload
````

## API Endpoints

- `GET /` - API health check
- `POST /screener` - Screen stocks based on technical and fundamental criteria
- `POST /backtester` - Backtest trading strategies (implementation pending) 