# LULC_ISA
A simple machine learning -based classifier to differntiate between the different regions of the Kolkata region based on satellite imagery. 

This project performs a supervised land use and land cover (LULC) classification of Kolkata, India, using Sentinel-2 satellite imagery within the Google Earth Engine (GEE) platform. The objective is to map the urban landscape into distinct classes and analyze their spatial distribution.

<img width="714" height="553" alt="image" src="https://github.com/user-attachments/assets/64e22f54-e0c1-4a5e-a67b-c7be0f59ddb4" />

## Objective
The primary goals of this analysis are:
* To classify the land cover of Kolkata into four major categories: Water Bodies, Vegetation, Built-up Areas, and Barren Land.
* To generate a spatially accurate LULC map using a supervised Random Forest classifier.
* To calculate the total area (in sq. km) for each land cover class.
* To assess the accuracy of the classification using a confusion matrix, overall accuracy, and the Kappa coefficient.

## Study Area
* Name: Kolkata, West Bengal, India

* Description: As the primary business, commercial, and financial hub of Eastern India, Kolkata is a major metropolitan area situated on the eastern bank of the Hooghly River. Its rapid urbanization and significant socio-economic importance make it a critical area for LULC monitoring to support sustainable planning and environmental management.

* Area of Interest (AOI) Coordinates: A rectangular polygon defined by the corner points: [88.20, 22.45] and [88.50, 22.70].

##Data and Methodology
Data Source
* Satellite: Sentinel-2 MSI (Level-2A Surface Reflectance)
* Provider: Copernicus / European Space Agency (ESA)
* Platform: Google Earth Engine
* Date Range: January 1, 2024 - March 31, 2024
* Cloud Cover Filter: Less than 10%

##Methodology
The project follows a standard supervised classification workflow implemented entirely in Google Earth Engine:
1. Define Area of Interest (AOI): A polygon is created to define the Kolkata study area.
2. Image Collection: Sentinel-2 imagery is filtered by the AOI, date range, and cloud cover. A cloud-masked median composite image is generated.
3. Feature Engineering: Spectral indices like NDVI (Normalized Difference Vegetation Index) and NDWI (Normalized Difference Water Index) are calculated and added as bands to the image to improve classification accuracy.
4. Data Collection: Training polygons are manually drawn for each of the four classes (Water, Vegetation, Built-up, Barren Land).
5. Training Data Generation: The training polygons are used to sample pixel values from the composite image, creating a labeled training dataset.
6. Train/Test Split: The collected samples are split into a 70% training set and a 30% testing set.
7. Classifier Training: A Random Forest classifier with 100 trees is trained using the training set.
8. Image Classification: The trained classifier is applied to the entire composite image to generate the final LULC map.
9. Accuracy Assessment: The model's performance is evaluated on the test set by generating a confusion matrix and calculating the Overall Accuracy and Kappa Coefficient.
10. Area Calculation: The area for each LULC class is calculated by counting pixels and converting to square kilometers.

##Key Results
* Overall Classification Accuracy: 88.2%

* Kappa Coefficient: 0.82

##Land Cover Area Distribution

|Class| Area (sq. km) | Percentage | 
|-----|---------------|----------- |
| Built-up Area| 159.26 | 50.1% |
| Vegetation | 79.54 | 25.0% |
| Water Bodies| 48.77 |15.3% |
| Barren Land | 30.43 | 9.6% |

## How to Use This Repository
Open Google Earth Engine: Go to the GEE Code Editor.

Create a New Script: Copy the entire content of the gee_script.js file from this repository and paste it into the GEE editor.

Draw Training Polygons: Before running the script, you must manually draw polygons for the four land cover classes as instructed in the script's comments.

Run the Script: Click the "Run" button in the GEE editor. The final LULC map will be displayed on the map panel, and the accuracy and area results will be printed in the Console tab
