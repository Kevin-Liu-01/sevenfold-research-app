# Sevenfold Web App

## Auth

All components of the webapp are surrounded by an auth provider which manages
user session and data.

## Workbench

The workbench uses a `WorkbenchContext` that is used by both the sidebar and the
viewer component to share session information.

## Viewers

Within one project a user exists in their workbench. The workbench has multiple
different viewers that represent different sets of features for different
parts of the research workflow. These are called views and can be thought of as
similar to pages (except in this case, there is no routing).
