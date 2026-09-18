# FireAnalysis

Analysis of NASA satellite-detected active-fire hotspots in Greece, Israel, Italy, and Tunisia.

## Interactive dashboard

This repository includes a GitHub Pages-ready React dashboard for exploring the archive. It combines time-series analysis, a spatial hotspot field, country comparisons, detection anatomy, and an analyst readout that updates with the selected filters.

### Run locally

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite. To create a production build:

```bash
npm run build
```

### Deploy to GitHub Pages

The workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds and deploys the dashboard whenever `main` is updated. In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**.

## Dataset

The project uses the [2000–2021 Tunisia–Israel–Greece–Italy NASA dataset on Kaggle](https://www.kaggle.com/datasets/brsdincer/2000-2021-tunisiaisraelgreeceitaly-nasa).

The data comes from NASA MODIS active-fire observations collected by the Terra and Aqua satellites. Each row is a detected hotspot pixel during a satellite overpass; it should not be interpreted as a unique, confirmed wildfire incident.

### Coverage

| Country | Records | Date range |
| --- | ---: | --- |
| Greece | 39,040 | 2000-11-01 to 2021-08-10 |
| Israel | 3,206 | 2000-11-02 to 2021-08-07 |
| Italy | 109,891 | 2000-11-02 to 2021-08-10 |
| Tunisia | 5,642 | 2001-02-01 to 2021-08-10 |
| **Total** | **157,779** | **2000–2021** |

The source dataset was published in August 2021, so it does not contain observations after 2021-08-10.

## Files

- [`Data/GREECE_2000_2021 - fire_archive_M-C61_214279.csv`](<Data/GREECE_2000_2021 - fire_archive_M-C61_214279.csv>)
- [`Data/ISRAEL_2000_2021 - fire_archive_M-C61_214285.csv`](<Data/ISRAEL_2000_2021 - fire_archive_M-C61_214285.csv>)
- [`Data/ITALY_2000_2021 - fire_archive_M-C61_214280.csv`](<Data/ITALY_2000_2021 - fire_archive_M-C61_214280.csv>)
- [`Data/TUNISIA_2000_2021_M-C61_214281.csv`](<Data/TUNISIA_2000_2021_M-C61_214281.csv>)

## Columns

| Column | Description |
| --- | --- |
| `latitude`, `longitude` | Geographic coordinates of the detected hotspot |
| `brightness` | MODIS I-21 brightness temperature, in Kelvin |
| `scan`, `track` | Approximate pixel dimensions from the satellite scan geometry |
| `acq_date`, `acq_time` | Acquisition date and UTC time |
| `satellite` | Terra or Aqua |
| `instrument` | MODIS |
| `confidence` | Detection confidence value |
| `version` | MODIS processing version, including `6.03` and `6.1NRT` |
| `bright_t31` | MODIS I-31 brightness temperature, in Kelvin |
| `frp` | Fire Radiative Power, in megawatts |
| `daynight` | `D` for daytime or `N` for nighttime |
| `type` | Hotspot type: `0` vegetation fire, `1` active volcano, `2` other static land source, `3` offshore detection |

## Data-quality notes

- The Kaggle description mentions MODIS and VIIRS, but the files in this repository contain MODIS observations from Terra and Aqua.
- The Kaggle description also contains an outdated reference to Turkey; the files used here cover Greece, Israel, Italy, and Tunisia.
- Some records from the `6.1NRT` processing version have an empty `type` value.
- Fire Radiative Power is a satellite-derived estimate and should be aggregated over time or area for more reliable comparisons.

## Possible analyses

- Seasonal and yearly hotspot trends
- Geographic concentration and hotspot maps
- Country-level comparisons
- Daytime versus nighttime activity
- Fire intensity analysis using `frp`
- Detection-confidence and processing-version checks

## License and attribution

The dataset is published on Kaggle under “Database: Open Database, Contents: Database Contents.” See the [original Kaggle page](https://www.kaggle.com/datasets/brsdincer/2000-2021-tunisiaisraelgreeceitaly-nasa) for the source description and attribution details.
