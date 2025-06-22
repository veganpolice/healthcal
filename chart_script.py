import plotly.graph_objects as go
import numpy as np

# Define components with systematic left-to-right layout
components_data = {
    "User Interface": {"pos": (0.1, 0.6), "category": "frontend"},
    "Insurance OCR": {"pos": (0.3, 0.8), "category": "ai"},
    "Preference AI": {"pos": (0.3, 0.4), "category": "ai"},
    "Coverage Data": {"pos": (0.5, 0.8), "category": "data"},
    "Health Profile": {"pos": (0.5, 0.4), "category": "data"},
    "Scheduling AI": {"pos": (0.7, 0.6), "category": "ai"},
    "Provider DB": {"pos": (0.7, 0.2), "category": "data"},
    "Calendar Gen": {"pos": (0.9, 0.6), "category": "output"},
    "Communication": {"pos": (0.9, 0.2), "category": "integration"}
}

# Define main data flow connections
connections = [
    ("User Interface", "Insurance OCR"),
    ("User Interface", "Preference AI"),
    ("Insurance OCR", "Coverage Data"),
    ("Preference AI", "Health Profile"),
    ("Coverage Data", "Scheduling AI"),
    ("Health Profile", "Scheduling AI"),
    ("Scheduling AI", "Provider DB"),
    ("Provider DB", "Calendar Gen"),
    ("Calendar Gen", "User Interface"),
    ("Calendar Gen", "Communication")
]

# Healthcare color scheme - blues and greens
color_map = {
    "frontend": "#1565C0",    # Deep blue
    "ai": "#2E7D32",          # Deep green
    "data": "#0277BD",        # Medium blue
    "output": "#388E3C",      # Medium green
    "integration": "#0288D1", # Light blue
    "security": "#D32F2F"     # Red for security
}

# Create the figure
fig = go.Figure()

# Add connecting lines first (so they appear behind nodes)
for connection in connections:
    start_node = connection[0]
    end_node = connection[1]
    
    x0, y0 = components_data[start_node]["pos"]
    x1, y1 = components_data[end_node]["pos"]
    
    # Add arrow line
    fig.add_trace(go.Scatter(
        x=[x0, x1], y=[y0, y1],
        mode='lines',
        line=dict(width=3, color='#455A64'),
        hoverinfo='none',
        showlegend=False
    ))
    
    # Add arrowhead
    # Calculate arrow direction
    dx = x1 - x0
    dy = y1 - y0
    length = np.sqrt(dx**2 + dy**2)
    
    # Normalize and create arrowhead
    if length > 0:
        dx_norm = dx / length
        dy_norm = dy / length
        
        # Arrow position slightly before the end node
        arrow_x = x1 - 0.03 * dx_norm
        arrow_y = y1 - 0.03 * dy_norm
        
        fig.add_trace(go.Scatter(
            x=[arrow_x], y=[arrow_y],
            mode='markers',
            marker=dict(
                symbol='triangle-right',
                size=8,
                color='#455A64',
                angle=np.degrees(np.arctan2(dy, dx))
            ),
            hoverinfo='none',
            showlegend=False
        ))

# Add nodes by category
for category, color in color_map.items():
    category_nodes = {k: v for k, v in components_data.items() if v["category"] == category}
    
    if category_nodes:
        node_x = [info["pos"][0] for info in category_nodes.values()]
        node_y = [info["pos"][1] for info in category_nodes.values()]
        node_text = [name for name in category_nodes.keys()]
        
        fig.add_trace(go.Scatter(
            x=node_x, y=node_y,
            mode='markers+text',
            marker=dict(
                size=60,
                color=color,
                line=dict(width=3, color='white')
            ),
            text=node_text,
            textposition="middle center",
            textfont=dict(size=11, color='white', family='Arial Black'),
            hoverinfo='text',
            hovertext=node_text,
            name=category.title().replace('_', ' '),
            showlegend=True
        ))

# Add privacy layer as background overlay
fig.add_shape(
    type="rect",
    x0=0.05, y0=0.05,
    x1=0.95, y1=0.95,
    fillcolor="rgba(211, 47, 47, 0.05)",
    line=dict(color="rgba(211, 47, 47, 0.3)", width=2, dash="dot"),
)

# Add privacy layer label
fig.add_trace(go.Scatter(
    x=[0.5], y=[0.1],
    mode='markers+text',
    marker=dict(size=40, color='#D32F2F', line=dict(width=2, color='white')),
    text=['Privacy Layer<br>PIPEDA'],
    textposition="middle center",
    textfont=dict(size=10, color='white'),
    hoverinfo='text',
    hovertext=['Privacy Layer - PIPEDA Compliance'],
    name='Security',
    showlegend=False
))

fig.update_layout(
    title="HealthSync AI MVP Architecture",
    showlegend=True,
    legend=dict(orientation='h', yanchor='bottom', y=1.05, xanchor='center', x=0.5),
    xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
    yaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
    plot_bgcolor='white',
    hovermode='closest'
)

fig.update_xaxes(range=[0, 1])
fig.update_yaxes(range=[0, 1])

# Save the chart
fig.write_image("healthsync_architecture.png")