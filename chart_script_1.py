import plotly.graph_objects as go
import pandas as pd

# Data from the provided JSON
data = {
    "steps": [
        {"id": 1, "title": "Welcome Landing", "description": "User arrives at HealthSync AI", "type": "start", "time": "30 seconds"},
        {"id": 2, "title": "Upload Insurance", "description": "Upload policy document", "type": "action", "time": "2 minutes"},
        {"id": 3, "title": "AI Processing", "description": "OCR extracts coverage data", "type": "ai", "time": "30 seconds"},
        {"id": 4, "title": "Review Coverage", "description": "Verify extracted information", "type": "review", "time": "1 minute"},
        {"id": 5, "title": "Health Questionnaire", "description": "Answer preference questions", "type": "action", "time": "5 minutes"},
        {"id": 6, "title": "AI Profile Generation", "description": "Create health profile", "type": "ai", "time": "15 seconds"},
        {"id": 7, "title": "View Annual Calendar", "description": "See proposed appointments", "type": "review", "time": "3 minutes"},
        {"id": 8, "title": "Appointment Details", "description": "Review provider information", "type": "review", "time": "2 minutes"},
        {"id": 9, "title": "Make Changes?", "description": "Accept or modify appointments", "type": "decision", "time": "1 minute"},
        {"id": 10, "title": "Send to Providers", "description": "Submit appointment requests", "type": "action", "time": "30 seconds"},
        {"id": 11, "title": "Track Status", "description": "Monitor appointment confirmations", "type": "monitoring", "time": "Ongoing"},
        {"id": 12, "title": "Confirmation", "description": "Receive provider responses", "type": "end", "time": "24-48 hours"}
    ]
}

# Convert to DataFrame
df = pd.DataFrame(data["steps"])

# Create better abbreviated titles (15 char limit)
title_map = {
    "Welcome Landing": "Welcome",
    "Upload Insurance": "Upload Docs",
    "AI Processing": "AI Process",
    "Review Coverage": "Review Plan",
    "Health Questionnaire": "Health Survey",
    "AI Profile Generation": "AI Profile",
    "View Annual Calendar": "View Calendar",
    "Appointment Details": "Appt Details",
    "Make Changes?": "Accept/Modify?",
    "Send to Providers": "Send Requests",
    "Track Status": "Track Status",
    "Confirmation": "Confirmation"
}

df['display_title'] = df['title'].map(title_map)

# Use same x-coordinate for vertical layout
df['x_pos'] = 2  # Single column
df['y_pos'] = range(len(df), 0, -1)  # Top to bottom

# Healthcare color scheme (blues and greens)
type_colors = {
    'start': '#1FB8CD',      # Strong cyan (healthcare blue)
    'action': '#5D878F',     # Cyan (healthcare blue-green)
    'ai': '#13343B',         # Dark cyan (deep healthcare blue)
    'review': '#ECEBD5',     # Light green (healthcare green)
    'decision': '#1FB8CD',   # Strong cyan (healthcare blue)
    'monitoring': '#5D878F', # Cyan (healthcare blue-green)
    'end': '#1FB8CD'         # Strong cyan (healthcare blue)
}

# Create the flowchart
fig = go.Figure()

# Add connecting lines for vertical flow
for i in range(len(df) - 1):
    if i == 8:  # Decision point - show branching
        # Main path (Accept) - straight down
        fig.add_trace(go.Scatter(
            x=[df.iloc[i]['x_pos'], df.iloc[i+1]['x_pos']], 
            y=[df.iloc[i]['y_pos'], df.iloc[i+1]['y_pos']],
            mode='lines',
            line=dict(color='#5D878F', width=3),
            showlegend=False,
            hoverinfo='skip',
            cliponaxis=False
        ))
        # Loop back path (Modify) - curved back to step 8
        fig.add_trace(go.Scatter(
            x=[df.iloc[i]['x_pos'], df.iloc[i]['x_pos'] + 0.8, df.iloc[i]['x_pos'] + 0.8, df.iloc[i-1]['x_pos']], 
            y=[df.iloc[i]['y_pos'], df.iloc[i]['y_pos'], df.iloc[i-1]['y_pos'], df.iloc[i-1]['y_pos']],
            mode='lines',
            line=dict(color='#5D878F', width=2, dash='dot'),
            showlegend=False,
            hoverinfo='skip',
            cliponaxis=False
        ))
    else:
        fig.add_trace(go.Scatter(
            x=[df.iloc[i]['x_pos'], df.iloc[i+1]['x_pos']], 
            y=[df.iloc[i]['y_pos'], df.iloc[i+1]['y_pos']],
            mode='lines',
            line=dict(color='#5D878F', width=3),
            showlegend=False,
            hoverinfo='skip',
            cliponaxis=False
        ))

# Add points for each step with different markers for AI steps
for i, row in df.iterrows():
    # Special markers for AI steps
    if row['type'] == 'ai':
        marker_symbol = 'diamond'
        marker_size = 25
    elif row['type'] == 'decision':
        marker_symbol = 'diamond'
        marker_size = 25
    else:
        marker_symbol = 'circle'
        marker_size = 22
    
    fig.add_trace(go.Scatter(
        x=[row['x_pos']],
        y=[row['y_pos']],
        mode='markers+text',
        marker=dict(
            size=marker_size,
            color=type_colors[row['type']],
            symbol=marker_symbol,
            line=dict(width=3, color='white')
        ),
        text=row['display_title'],
        textposition='middle right',
        textfont=dict(size=14, color='black'),
        name=row['type'].title(),
        hovertemplate='<b>%{text}</b><br>Time: ' + row['time'] + '<br>Type: ' + row['type'].title() + '<extra></extra>',
        cliponaxis=False,
        showlegend=False
    ))

# Add time annotations next to each step
for i, row in df.iterrows():
    fig.add_trace(go.Scatter(
        x=[row['x_pos'] + 1.2],
        y=[row['y_pos']],
        mode='text',
        text=row['time'],
        textfont=dict(size=11, color='gray'),
        showlegend=False,
        hoverinfo='skip',
        cliponaxis=False
    ))

# Add step type legend manually
legend_types = list(set(df['type']))
legend_y_start = 13
for i, step_type in enumerate(legend_types):
    if step_type == 'ai' or step_type == 'decision':
        marker_symbol = 'diamond'
    else:
        marker_symbol = 'circle'
        
    fig.add_trace(go.Scatter(
        x=[0.2],
        y=[legend_y_start - i * 0.4],
        mode='markers+text',
        marker=dict(
            size=15,
            color=type_colors[step_type],
            symbol=marker_symbol,
            line=dict(width=2, color='white')
        ),
        text=step_type.title(),
        textposition='middle right',
        textfont=dict(size=12),
        showlegend=False,
        hoverinfo='skip',
        cliponaxis=False
    ))

# Add branch labels for decision point
fig.add_trace(go.Scatter(
    x=[2.4],
    y=[4],
    mode='text',
    text='Accept',
    textfont=dict(size=10, color='#5D878F'),
    showlegend=False,
    hoverinfo='skip',
    cliponaxis=False
))

fig.add_trace(go.Scatter(
    x=[3.2],
    y=[4.5],
    mode='text',
    text='Modify',
    textfont=dict(size=10, color='#5D878F'),
    showlegend=False,
    hoverinfo='skip',
    cliponaxis=False
))

# Update layout
fig.update_layout(
    title='HealthSync User Journey',
    showlegend=False
)

# Update axes for vertical layout
fig.update_xaxes(
    showgrid=False,
    showticklabels=False,
    range=[-0.5, 4.5]
)

fig.update_yaxes(
    showgrid=False,
    showticklabels=False,
    range=[0, 14]
)

# Save the chart
fig.write_image("healthsync_user_journey.png")