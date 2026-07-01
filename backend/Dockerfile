FROM python:3.12-slim

# Install system dependencies and R base
RUN apt-get update && apt-get install -y \
    r-base \
    libcurl4-openssl-dev \
    libssl-dev \
    libxml2-dev \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install necessary R packages from CRAN
RUN Rscript -e "install.packages(c('tidyverse', 'jsonlite', 'lubridate', 'ggplot2', 'dplyr', 'knitr'), repos='http://cran.rstudio.com/')"

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Do not copy all files here so that docker-compose volume hot-reload works smoothly
EXPOSE 8000
