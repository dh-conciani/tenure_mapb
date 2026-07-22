## assess land tenure
# dhemerson.costa@ipam.org.br

## read libraries
library(dplyr)
library(ggplot2)
library(readxl)
library(treemapify)

options(scipen = 9e3)

## load data
data <- read.csv("./table/collection11-brazil-tenure.csv")

## translate classes
lulc <- read_xlsx("./dict/legend_col11.xlsx")

data2 <- data %>%
  mutate(
    class = as.numeric(class)
  ) %>%
  left_join(
    lulc %>%
      mutate(
        `NEW ID` = as.numeric(`NEW ID`)
      ) %>%
      select(
        `NEW ID`,
        Level_0_5,
        Level_1,
        Level_4,
        `COLLECTION 11 - CLASSES`,
        `NEW COLOR NUMER`
      ),
    by = c("class" = "NEW ID")
  )

## tenure
tenure <- read.csv("./dict/tenure_col11.csv")

data3 <- data2 %>%
  mutate(
    territory = as.numeric(territory)
  ) %>%
  left_join(
    tenure %>%
      mutate(
        id = as.numeric(id)
      ) %>%
      select(
        id,
        categoria_fundiaria,
        car,
        level_0,
        level_1
      ),
    by = c("territory" = "id")
  )

## aggregate
aggregated <- data3 %>%
  group_by(
    year,
    Level_0_5,
    level_0
  ) %>%
  summarise(
    area = sum(area, na.rm = TRUE),
    .groups = "drop"
  )

## order of land-tenure categories
level_order <- c(
  "Áreas Privadas com Registro Fundiário Georreferenciado",
  "Sem Registro Fundiário Georreferenciado com CAR",
  "Terras Públicas ou Sem Registro Fundiário Georreferenciado",
  "Áreas Protegidas ou de Uso coletivo "
)

## order of legend categories
fill_order <- c(
  "Corpo D'água",
  "Área não vegetada",
  "Agropecuária",
  "Vegetação Nativa"
)

## set first and last years
first_year <- min(aggregated$year, na.rm = TRUE)
last_year  <- max(aggregated$year, na.rm = TRUE)

## prepare plot data
aggregated_plot <- aggregated %>%
  filter(
    year %in% c(first_year, last_year),
    level_0 != "Massas d'água"
  ) %>%
  group_by(
    year,
    level_0
  ) %>%
  mutate(
    ## Total area across all Level_0_5 classes
    total_area = sum(area, na.rm = TRUE),
    
    ## Percentage of each class relative to the total
    percentage = 100 * area / total_area,
    
    ## Labels only for Vegetação Nativa and Agropecuária
    class_label = if_else(
      Level_0_5 %in% c(
        "Vegetação Nativa",
        "Agropecuária"
      ),
      sprintf(
        "%.1f%% (%.1f Mha)",
        percentage,
        area / 1e6
      ),
      ""
    ),
    
    ## Use white text over native vegetation and black over agriculture
    label_color = case_when(
      Level_0_5 == "Vegetação Nativa" ~ "white",
      Level_0_5 == "Agropecuária" ~ "black",
      TRUE ~ "black"
    )
  ) %>%
  ungroup() %>%
  mutate(
    level_0 = factor(
      level_0,
      levels = level_order
    ),
    
    ## 1985 above and 2025 below after coord_flip()
    year = factor(
      year,
      levels = c(last_year, first_year)
    ),
    
    Level_0_5 = factor(
      Level_0_5,
      levels = fill_order
    )
  ) %>%
  na.omit()

## plot
## plot
land_tenure <- ggplot(
  data = aggregated_plot,
  aes(
    x = year,
    y = area / 1e6,
    fill = Level_0_5
  )
) +
  geom_col() +
  
  ## Add area and percentage labels
  geom_text(
    aes(
      label = class_label,
      color = label_color
    ),
    position = position_stack(vjust = 0.5),
    size = 3,
    fontface = 'bold',
    lineheight = 0.9,
    show.legend = FALSE
  ) +
  
  facet_wrap(
    ~ level_0,
    scales = "free_y",
    nrow = 4
  ) +
  
  coord_flip() +
  
  labs(
    x = NULL,
    y = "Área (Mha)",
    fill = NULL
  ) +
  
  theme_minimal(
    base_size = 11
  ) +
  
  theme(
    legend.position = "bottom",
    
    strip.text = element_text(
      face = "bold",
      size = 11
    ),
    
    axis.text = element_text(
      size = 11
    ),
    
    axis.title = element_text(
      size = 11
    ),
    
    legend.text = element_text(
      size = 11
    )
  ) +
  
  scale_fill_manual(
    values = c(
      "Vegetação Nativa" = "#1F8D49",
      "Agropecuária" = "#FFEFC3",
      "Área não vegetada" = "#D4271E",
      "Corpo D'água" = "#2532E4"
    ),
    breaks = fill_order,
    drop = FALSE
  ) +
  
  ## Apply the colors defined in label_color directly
  scale_color_identity()

land_tenure

## save
## export PNG for Google Slides
ggsave(
  filename = "./land-tenure-level0-1985-2025.png",
  plot = land_tenure,
  device = "png",
  width = 16,
  height = 5.0,
  units = "in",
  dpi = 300,
  bg = "white"
)


############################################################
## Figure 2 
library(dplyr)
library(tidyr)
library(ggplot2)
library(purrr)
library(patchwork)
library(grid)
library(ggtext)

## ============================================================
## 1. Aggregate area
## ============================================================

aggregated <- data3 %>%
  filter(
    !is.na(year),
    !is.na(level_0),
    !is.na(level_1),
    !is.na(Level_0_5)
  ) %>%
  group_by(
    year,
    level_0,
    level_1,
    Level_0_5
  ) %>%
  summarise(
    area = sum(area, na.rm = TRUE),
    .groups = "drop"
  )

## ============================================================
## 2. Category order
## ============================================================

level_order <- c(
  "Áreas Privadas com Registro Fundiário Georreferenciado",
  "Sem Registro Fundiário Georreferenciado com CAR",
  "Terras Públicas ou Sem Registro Fundiário Georreferenciado",
  "Áreas Protegidas ou de Uso coletivo "
)

fill_order <- c(
  "Vegetação Nativa",
  "Agropecuária",
  "Área não vegetada",
  "Corpo D'água"
)

## ============================================================
## 3. Labels only for the plot
## ============================================================

level_1_labels <- c(
  "Sem Registro Fundiário Georreferenciado com CAR" =
    "Sem Registro Fundiário\nGeorreferenciado com CAR",
  
  "Sem Registro Fundiário Georreferenciado sem CAR" =
    "Sem Registro Fundiário\nGeorreferenciado sem CAR"
)

## ============================================================
## 4. Complete missing land-cover classes
## ============================================================

aggregated <- aggregated %>%
  group_by(
    level_0,
    level_1
  ) %>%
  complete(
    year,
    Level_0_5 = fill_order,
    fill = list(area = 0)
  ) %>%
  ungroup()

## ============================================================
## 5. Calculate percentages safely
## ============================================================

aggregated <- aggregated %>%
  group_by(
    year,
    level_0,
    level_1
  ) %>%
  mutate(
    total_area = sum(area, na.rm = TRUE),
    proportion = if_else(total_area > 0, area / total_area, NA_real_),
    percentage = 100 * proportion,
    area_mha = area / 1e6,
    total_area_mha = total_area / 1e6
  ) %>%
  ungroup() %>%
  filter(is.finite(percentage))

## ============================================================
## Facet area and share of total in 2025
## ============================================================

target_year <- 2025

facet_area_summary <- aggregated %>%
  filter(
    year == target_year,
    level_0 != "Massas d'água"
  ) %>%
  group_by(
    level_0,
    level_1
  ) %>%
  summarise(
    facet_area = sum(area, na.rm = TRUE),
    .groups = "drop"
  ) %>%
  mutate(
    total_area_all_facets = sum(facet_area, na.rm = TRUE),
    share_of_total = 100 * facet_area / total_area_all_facets,
    facet_area_mha = facet_area / 1e6,
    area_text = sprintf(
      "%.1f%% do Brasil (%.1f Mha)",
      share_of_total,
      facet_area_mha
    )
  )


## ============================================================
## 6. Prepare plotting data
## ============================================================

aggregated_plot <- aggregated %>%
  filter(level_0 != "Massas d'água") %>%
  mutate(
    level_0 = factor(level_0, levels = level_order),
    Level_0_5 = factor(Level_0_5, levels = fill_order),
    year = as.numeric(as.character(year))
  ) %>%
  filter(
    !is.na(level_0),
    !is.na(level_1),
    !is.na(Level_0_5),
    !is.na(year),
    is.finite(percentage)
  ) %>%
  droplevels()

## ============================================================
## Labels for predominant classes in first and last facet years
## ============================================================

minimum_share <- 10
label_inset   <- 0.18   # 18% inward from each panel boundary

endpoint_labels <- aggregated_plot %>%
  group_by(
    level_0,
    level_1
  ) %>%
  mutate(
    first_facet_year = min(year, na.rm = TRUE),
    last_facet_year  = max(year, na.rm = TRUE),
    year_range       = last_facet_year - first_facet_year
  ) %>%
  filter(
    year == first_facet_year |
      year == last_facet_year
  ) %>%
  mutate(
    ## Keep centered labels well inside the facet boundaries
    label_year = case_when(
      year == first_facet_year &
        first_facet_year != last_facet_year ~
        first_facet_year + label_inset * year_range,
      
      year == last_facet_year &
        first_facet_year != last_facet_year ~
        last_facet_year - label_inset * year_range,
      
      TRUE ~ year
    ),
    
    endpoint_label = if_else(
      percentage >= minimum_share,
      sprintf(
        "%.0f%%\n(%.1f Mha)",
        percentage,
        area_mha
      ),
      NA_character_
    ),
    
    label_color = case_when(
      Level_0_5 == "Agropecuária"      ~ "#222222",
      Level_0_5 == "Vegetação Nativa"  ~ "#FFFFFF",
      Level_0_5 == "Área não vegetada" ~ "#FFFFFF",
      Level_0_5 == "Corpo D'água"      ~ "#FFFFFF",
      TRUE                             ~ "#222222"
    )
  ) %>%
  ungroup()

## ============================================================
## 7. Maximum number of panels in any row
## ============================================================

max_panels <- aggregated_plot %>%
  distinct(level_0, level_1) %>%
  count(level_0, name = "n_panels") %>%
  summarise(maximum = max(n_panels)) %>%
  pull(maximum)

## ============================================================
## 8. Function to create each level_0 row
## ============================================================

make_facet_row <- function(level_name) {
  
  plot_data <- aggregated_plot %>%
    filter(level_0 == level_name) %>%
    droplevels()
  
  label_data <- endpoint_labels %>%
    filter(level_0 == level_name) %>%
    droplevels()
  
  if (nrow(plot_data) == 0) {
    return(NULL)
  }
  
  n_panels <- n_distinct(plot_data$level_1)
  
  ## ----------------------------------------------------------
  ## Create facet labels for this specific level_0
  ## ----------------------------------------------------------
  
  facet_labels_row <- facet_area_summary %>%
    filter(level_0 == level_name) %>%
    mutate(
      facet_name = case_when(
        level_1 ==
          "Sem Registro Fundiário Georreferenciado com CAR" ~
          "Sem Registro Fundiário<br>Georreferenciado com CAR",
        
        level_1 ==
          "Sem Registro Fundiário Georreferenciado sem CAR" ~
          "Sem Registro Fundiário<br>Georreferenciado sem CAR",
        
        TRUE ~ level_1
      ),
      
      full_label = paste0(
        "<b>", facet_name, "</b>",
        "<br>",
        "<span style='font-size:8pt;font-weight:normal;'>",
        area_text,
        "</span>"
      )
    ) %>%
    select(
      level_1,
      full_label
    ) %>%
    tibble::deframe()
  
  p <- ggplot(
    data = plot_data,
    aes(
      x = year,
      y = percentage,
      fill = Level_0_5,
      group = Level_0_5
    )
  ) +
    geom_area(
      position = "stack",
      na.rm = TRUE
    ) +
    geom_text(
      data = label_data,
      aes(
        x = label_year,
        y = percentage,
        label = endpoint_label,
        group = Level_0_5,
        color = label_color
      ),
      position = position_stack(vjust = 0.5),
      inherit.aes = FALSE,
      na.rm = TRUE,
      size = 3,
      fontface = "plain",
      lineheight = 0.88,
      hjust = 0.5
    ) +
    scale_color_identity(
      guide = "none"
    ) +
    
    facet_grid(
      rows = vars(level_0),
      cols = vars(level_1),
      switch = "y",
      drop = TRUE,
      labeller = labeller(
        level_1 = as_labeller(
          facet_labels_row,
          default = label_value
        )
      )
    ) +
    scale_y_continuous(
      breaks = seq(0, 100, 25),
      labels = function(x) paste0(x, "%"),
      expand = expansion(mult = c(0, 0))
    ) +
    coord_cartesian(
      ylim = c(0, 100)
    ) +
    scale_fill_manual(
      values = c(
        "Vegetação Nativa"  = "#1F8D49",
        "Agropecuária"      = "#FFEFC3",
        "Área não vegetada" = "#D4271E",
        "Corpo D'água"      = "#2532E4"
      ),
      breaks = fill_order,
      drop = FALSE
    ) +
    labs(
      x = NULL,
      y = NULL,
      fill = NULL
    ) +
    theme_minimal() +
    theme(
      strip.placement = "outside",
      
      ## level_0 row labels
      strip.text.y.left = element_text(
        angle = 0,
        hjust = 1,
        size = 4.5,
        face = "bold"
      ),
      
      ## level_1 facet name + Brazil share
      strip.text.x = ggtext::element_markdown(
        size = 9.5,
        face = "plain",
        hjust = 0,
        lineheight = 1.02,
        margin = margin(
          t = 2,
          r = 2,
          b = 2,
          l = 2
        )
      ),
      
      ## Smaller axis values
      axis.text.x = element_text(
        size = 8.5
      ),
      
      axis.text.y = element_text(
        size = 8.5
      ),
      
      axis.title.y = element_text(
        size = 9
      ),
      
      legend.text = element_text(
        size = 9
      ),
      
      panel.spacing.x = unit(0.15, "cm"),
      panel.spacing.y = unit(0.15, "cm"),
      
      legend.position = "right"
    )
  
  ## Reserve empty columns rather than stretching the panel
  if (n_panels < max_panels) {
    
    empty_width <- max_panels - n_panels
    
    p <- (
      p | plot_spacer()
    ) +
      plot_layout(
        widths = c(
          n_panels,
          empty_width
        )
      )
  }
  
  p
}

## ============================================================
## 9. Build the complete figure
## ============================================================

plot_list <- map(
  level_order,
  make_facet_row
) %>%
  compact()

final_plot <- wrap_plots(
  plot_list,
  ncol = 1,
  guides = "collect"
) &
  theme(
    legend.position = "right"
  )

final_plot

### save
## export PNG for Google Slides
ggsave(
  filename = "./land-tenure-level1-1985-2025.png",
  plot = final_plot,
  device = "png",
  width = 13,
  height = 10,
  units = "in",
  dpi = 600,
  bg = "white"
)


