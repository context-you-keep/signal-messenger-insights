# Conversation Analytics & Statistics Features

> Inspired by Xobni for Outlook - bringing relationship intelligence to Signal message archives

This document outlines planned analytics features for the Signal Archive Viewer, divided into code-based statistics (database queries) and AI-enhanced insights (LLM analysis).

---

## 📊 Part 1: Code-Based Statistics (Database Queries)

These metrics can be calculated directly from the Signal database without AI/LLM processing.

### 1.1 Basic Conversation Metrics

**Volume & Balance**:
- Total messages (sent + received)
- Messages sent by you
- Messages received from them
- Conversation balance ratio (who talks more?)
- Messages per day/week/month (average activity rate)

**Timeline**:
- First message date
- Last message date
- Conversation age (days/months/years)
- Longest gap between messages (dormancy detection)
- Recent activity trend (increasing/decreasing activity)

**Implementation**: Simple COUNT() and timestamp queries on `messages` table filtered by `conversationId`.

---

### 1.2 Temporal Patterns

**Time of Day Analysis**:
- Most active hour of day (24-hour breakdown)
- Most active day of week
- Night owl vs morning person detection (message timestamp clustering)

**Response Time Statistics**:
- Average time to respond (you → them)
- Average time they respond (them → you)
- Fastest response time
- Slowest response time
- Median response time (better than average for outliers)

**Activity Streaks**:
- Conversation streak (consecutive days with messages)
- Current streak status
- Longest historical streak

**Implementation**:
- GROUP BY HOUR(sent_at), DAY(sent_at)
- Calculate time delta between consecutive messages with alternating senders
- Detect consecutive days with messages

---

### 1.3 Message Content Metrics

**Length Analysis**:
- Average message length (characters/words)
- Your average length vs their average length
- Longest message (yours and theirs)
- Short message frequency (< 10 chars)
- Long message frequency (> 200 chars)

**Content Type Detection**:
- Question frequency (messages containing "?")
- Exclamation usage (messages containing "!")
- Link sharing frequency (URL regex detection)
- Emoji usage statistics:
  - Total emoji count
  - Most used emojis (top 5)
  - Emoji sentiment (positive vs negative)
- Uppercase SHOUTING detection (% messages in caps)

**Attachments**:
- Total attachments sent/received
- Photos, videos, files, voice notes (by type)
- Attachment sharing balance (who shares more media?)

**Conversation Threading**:
- Quote/reply frequency (threaded message behavior)
- Average thread depth

**Implementation**:
- LENGTH(body) for text analysis
- Regex patterns for questions, links, emojis
- JOIN with attachments table (if available)
- Parse `quote` field for threading

---

### 1.4 Engagement Indicators

**Conversation Initiation**:
- Who starts conversations more often?
- First message of day count (yours vs theirs)
- Messages after long gaps (> 24 hours)
- "Cold start" success rate (do they respond to your initiations?)

**Conversation Depth**:
- Average responses before conversation "ends"
- Longest continuous exchange (back-and-forth count)
- One-sided message clusters (multiple messages without response)

**Engagement Quality**:
- Read receipts (if available in schema)
- Reaction usage (if stored separately)
- Typing indicators triggered (if logged)

**Implementation**:
- Detect conversation boundaries (gaps > X hours)
- Count alternating sender sequences
- Calculate message clusters by sender

---

### 1.5 Group-Specific Metrics

**For Group Conversations**:
- Your participation rate (your messages / total messages)
- Most active members (ranking by message count)
- Group size over time (members joined/left)
- @mentions of you vs you mentioning others
- Reply patterns (who replies to whom most often?)
- Lurker detection (members with low participation)

**Implementation**:
- Filter `type='group'` conversations
- Track member list changes over time
- Parse message body for @mentions

---

### 1.6 Relationship Context

**Social Graph**:
- Shared conversations (mutual contacts appearing in multiple conversations)
- Contact clustering (network analysis)
- Group overlap (shared group memberships)
- "Bridge" contacts (connecting different social circles)

**Importance Scoring**:
- Contact importance score (composite metric):
  - Message frequency weight
  - Recency weight
  - Engagement depth weight
  - Response rate weight
- Ranking among all contacts

**Implementation**:
- Cross-conversation analysis
- Weighted scoring algorithm
- Percentile ranking

---

### 1.7 Time-Based Trends

**Historical Analysis**:
- Activity timeline (messages per day/week/month)
- Busiest month/year in conversation history
- Conversation velocity (messages per hour during active periods)
- Seasonal patterns (compare quarters/seasons)

**Trend Detection**:
- Activity increasing/decreasing (slope calculation)
- Engagement shift detection (sudden changes)
- Relationship lifecycle stages:
  - Initiation phase (early messages)
  - Peak activity period
  - Current state

**Visualization Data**:
- Sparkline data for timeline views
- Heatmap data (hour × day of week)
- Trend arrows (↑ ↓ →)

**Implementation**:
- Time-series aggregation
- Moving averages for trend smoothing
- Statistical change detection

---

## 🤖 Part 2: AI-Enhanced Insights (LLM Analysis)

These features require LLM processing of message content for semantic understanding.

### 2.1 Relationship Analysis

**Classification**:
- Relationship type detection:
  - Close friend
  - Family member
  - Colleague/Professional
  - Acquaintance
  - Romantic relationship
- Confidence score (0-100%)
- Evidence/reasoning for classification

**Communication Style**:
- Formal vs casual tone
- Supportive vs transactional interactions
- Emotional vs factual communication
- Humor and playfulness indicators
- Vulnerability and openness level

**Relationship Trajectory**:
- Current state: "Growing closer" / "Maintaining" / "Drifting apart"
- Evidence from message patterns and content
- Key turning points in relationship
- Timeline of relationship evolution

**Implementation**:
- LLM prompt with conversation sample
- Few-shot classification
- Evidence extraction from messages

---

### 2.2 Sentiment & Tone Analysis

**Sentiment Distribution**:
- Overall sentiment (positive/negative/neutral percentages)
- Sentiment over time (trend visualization)
- Emotional intensity measurement

**Tone Detection**:
- Happy/excited periods
- Stressed/difficult periods
- Conflict detection (arguments, tension)
- Support and empathy moments
- Celebration and milestone moments

**Comparative Analysis**:
- Your sentiment vs their sentiment
- Emotional mirroring (do tones match?)
- Support balance (who provides more emotional support?)

**Mood Patterns**:
- Time-of-day mood variations
- Day-of-week patterns
- Correlation with external events (if mentioned)

**Implementation**:
- Sentiment analysis on message batches
- Temporal aggregation
- Comparative metrics

---

### 2.3 Topic Analysis

**Topic Extraction**:
- Main conversation topics (ranked by frequency):
  - Work & Career
  - Family & Relationships
  - Hobbies & Interests
  - Planning & Logistics
  - News & Current Events
  - Health & Wellness
  - Entertainment (movies, TV, music)
  - Travel & Adventures
  - Technology
  - Personal Growth
- Custom topic detection based on content

**Topic Evolution**:
- How topics change over time
- Emerging vs declining topics
- Topic duration (how long topics persist)

**Shared Interests**:
- Mutual interests identified
- Who introduces topics more often?
- Topic engagement (which generate most discussion?)

**Conversation Depth**:
- Surface-level vs meaningful topics
- Vulnerability and personal sharing
- Deep discussion indicators

**Implementation**:
- LLM-based topic modeling
- Temporal clustering
- Engagement metrics per topic

---

### 2.4 Communication Patterns

**Trigger Analysis**:
- Conversation triggers identified:
  - "Usually reaches out about [specific topics]"
  - "Often messages after [events/times]"
  - Context patterns (what prompts contact?)

**Support Patterns**:
- "Asks for advice about [topics]"
- "Celebrates your wins"
- "Checks in during tough times"
- Problem-solving vs emotional support
- Reciprocity of support

**Conversational Dynamics**:
- Who asks more questions?
- Who shares more life updates?
- Information vs emotional exchange balance
- Listening vs talking indicators

**Communication Habits**:
- Preferred communication times
- Message length preferences
- Response urgency patterns
- Conversation closure patterns

**Implementation**:
- Pattern extraction from message sequences
- Event correlation analysis
- Behavioral clustering

---

### 2.5 Predictive Insights

**Contact Prediction**:
- Expected next contact date (based on historical patterns)
- "Usually messages every X days"
- "Overdue for check-in (last contact N days ago)"
- Probability scoring for near-term contact

**Relationship Health Score**:
- Composite health metric (0-100)
- Factors considered:
  - Response time reciprocity
  - Engagement depth
  - Balance of initiation
  - Sentiment trends
  - Topic diversity
- Trend: improving / stable / declining
- Early warning indicators

**Conversation Recommendations**:
- "Might be a good time to check in"
- "Last conversation ended abruptly - consider follow up"
- "They mentioned [topic] last week - ask for update"
- "Relationship needs attention" warnings

**Implementation**:
- Time-series forecasting
- Composite scoring algorithms
- Threshold-based recommendations

---

### 2.6 Context Summaries

**Recent Activity Summary**:
- Last 7/30/90 days recap
- "Mostly discussed [topics]"
- Key themes and events
- Notable moments

**Relationship Highlight Reel**:
- Most meaningful conversations
- Important dates and milestones
- Memorable exchanges
- Funny/touching moments

**Memory Prompts**:
- "Remember when..." suggestions
- Callback opportunities
- Shared experiences recap
- Anniversary reminders

**Life Events Timeline**:
- Major events mentioned:
  - Births, deaths
  - Moves, relocations
  - Job changes
  - Relationship milestones
  - Health events
  - Achievements
- Chronological life story reconstruction

**Implementation**:
- Summarization prompts
- Event extraction and categorization
- Temporal organization

---

### 2.7 Communication Quality

**Engagement Score**:
- How thoughtful are responses?
- Do questions get answered?
- Are conversations satisfying/complete?
- Ghost/ignore detection

**Conversational Balance**:
- Is conversation one-sided?
- Do both parties invest equally?
- Effort asymmetry detection

**Vulnerability Index**:
- Depth of sharing
- Trust indicators
- Emotional openness
- Personal disclosure frequency

**Communication Effectiveness**:
- Clarity of communication
- Misunderstanding frequency
- Resolution patterns (how conflicts end)

**Implementation**:
- Quality scoring via LLM
- Balance calculation
- Pattern recognition

---

### 2.8 Social Graph Insights

**Network Position**:
- Social bridge score:
  - "Connects you to N other contacts"
  - Network centrality
- Social circle identification:
  - "Part of your 'work friends' cluster"
  - "Member of 'college friends' group"

**Influence Network**:
- "Often mentioned by [other contacts]"
- "Introduction source for [contacts]"
- Referral and recommendation patterns
- Information broker detection

**Relationship Dependencies**:
- Mutual contacts they connect you to
- Shared group memberships importance
- Social isolation risk (disconnected contacts)

**Implementation**:
- Graph analysis algorithms
- Clustering detection
- Centrality calculations

---

### 2.9 Smart Suggestions

**Conversation Starters**:
- "Ask about [topic they mentioned last week]"
- "Follow up on [unresolved topic]"
- Context-aware icebreakers
- Topic recommendations based on shared interests

**Relationship Maintenance**:
- "You haven't shared much lately - consider opening up"
- "They've shared a lot recently - show support"
- Balance correction suggestions
- Engagement improvement tips

**Reconnection Assistance**:
- Icebreaker ideas after long gaps
- "Safe" topics to restart conversation
- Shared interest refreshers
- Last conversation recap for context

**Conflict Resolution**:
- Tension detection
- De-escalation suggestions
- Apology opportunity identification
- "Smooth things over" prompts

**Implementation**:
- Context-aware prompt generation
- Action recommendation engine
- Personalized suggestion scoring

---

## 🎯 Implementation Phases

### Phase 1: Essential Stats (MVP) - ~2-3 days
**Goal**: Quick wins with immediate value

Core metrics:
- Total messages (sent/received split)
- First/last message dates
- Conversation age
- Activity trend (last 7/30/90 days)
- Response time averages
- Message length comparison
- Most active time of day

**UI**: Simple stats card with key numbers

---

### Phase 2: Engagement Metrics - ~3-4 days
**Goal**: Deeper relationship insights

Additional metrics:
- Who initiates more
- Conversation balance ratio
- Most active times (heatmap)
- Longest gap detection
- Attachment/link frequency
- Emoji usage stats
- Question/exclamation frequency

**UI**: Tabbed interface with charts

---

### Phase 3: AI Layer - Basic - ~5-7 days
**Goal**: Semantic understanding layer

AI features:
- Sentiment analysis (positive/negative)
- Topic extraction (top 3-5 topics)
- Relationship type classification
- Recent conversation summary (last 30 days)

**UI**: Insights panel with AI-generated content

---

### Phase 4: AI Layer - Advanced - ~1-2 weeks
**Goal**: Predictive and deep insights

Advanced AI:
- Relationship trajectory analysis
- Predictive next contact
- Health score with trends
- Smart conversation suggestions
- Deep pattern analysis
- Social graph insights

**UI**: Full analytics dashboard with recommendations

---

## 📐 UI/UX Design Considerations

### Layout Patterns

**Hero Metrics Section**:
- 3-4 large stat cards at top
- Most important numbers prominently displayed
- Trend indicators (↑ ↓ →)
- Quick comparison metrics

**Timeline Visualization**:
- Activity graph over time
- Sparkline for message frequency
- Heatmap for time-of-day patterns
- Milestone markers

**Tabbed Sections**:
- **Overview**: Hero metrics + key stats
- **Patterns**: Temporal analysis + engagement
- **Topics**: Content analysis + conversation themes
- **Insights**: AI-generated observations + suggestions

**Comparison Cards**:
- You vs Them side-by-side
- Balance indicators
- Visual balance bars
- Highlight asymmetries

**Smart Callouts**:
- Interesting findings highlighted
- "Did you know..." style insights
- Actionable recommendations
- Warning indicators

### Visual Inspiration

**Reference UIs**:
- **GitHub contribution graph**: Activity heatmap by day/hour
- **Spotify Wrapped**: Engaging year-in-review summaries
- **Apple Screen Time**: Time-of-day usage patterns
- **LinkedIn profile stats**: Engagement metrics and trends
- **Google Analytics**: Traffic patterns and trends
- **Strava activity summary**: Personal bests and achievements

### Interaction Patterns

**Progressive Disclosure**:
- Start with summary metrics
- Expand for detailed breakdowns
- "Show more" for historical data

**Comparative Views**:
- Toggle between absolute and relative metrics
- Time period selectors (7d/30d/90d/1y/all)
- Your stats vs their stats switcher

**Contextual Help**:
- Tooltips explaining metrics
- "Why this matters" explanations
- Calculation methodology

---

## 🔧 Technical Considerations

### Performance

**Expensive Calculations**:
- Cache computed statistics
- Incremental updates (don't recalculate everything)
- Progressive loading (show basic metrics first)
- Background calculation for complex AI insights

**Database Optimization**:
- Index on `conversationId` + `sent_at`
- Pre-computed aggregates table
- Materialized views for common queries

### Data Privacy

**Local Processing**:
- All calculations happen in-memory
- No data sent to external services (except optional LLM)
- User controls AI analysis opt-in

**LLM Integration Options**:
- Local LLM (Ollama, llama.cpp)
- API-based (OpenAI, Anthropic) with user consent
- Hybrid: stats locally, AI optionally

### Scalability

**Large Conversations**:
- Sampling for very large conversations (>10k messages)
- Window-based analysis (most recent N messages)
- Progressive statistics (calculate as data loads)

---

## 📚 References

### Historical Inspiration
- **Xobni** (2006-2013): Outlook contact analytics plugin
- **RescueTime**: Time tracking and productivity insights
- **Moment**: Phone usage analytics

### Modern Tools
- **Superhuman**: Email analytics and insights
- **Crystal**: Communication personality insights
- **FullContact**: Contact enrichment and relationship intelligence
- **HEY**: Email relationship management

### Research Areas
- Social network analysis
- Communication pattern analysis
- Relationship intelligence
- Sentiment analysis
- Topic modeling
- Predictive modeling

---

## 🚀 Next Steps

1. **Review & Prioritize**: Choose MVP feature set
2. **Design UI**: Create mockups for stats panel
3. **Backend API**: Design endpoints for statistics
4. **Database Queries**: Implement core metric calculations
5. **Frontend Integration**: Wire up stats panel
6. **AI Layer**: Design LLM integration architecture
7. **Testing**: Validate with real conversation data

---

*Last Updated: 2025-11-20*
*Status: Planning / Design Phase*
