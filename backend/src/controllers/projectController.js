const Project = require("../models/Project");
const Notification = require("../models/Notification");

exports.createProject = async (req, res) => {
  try {
    const project = await Project.create({
      ...req.body,
      clientId: req.user._id,
    });

    res.status(201).json({ message: "Project created successfully", project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllProjects = async (req, res) => {
  try {
    const {
      skills,
      location,
      budget,
      search,
      status = "open",
      page = 1,
      limit = 10,
      state,
      city,
      minBudget,
      maxBudget,
      complexity,
    } = req.query;

    // Build query conditions
    const conditions = [];

    // Status condition
    conditions.push({ status });

    // Handle skills - can be string (comma-separated) or array
    // $in operator means "match if skills array contains ANY of the selected skills" (OR logic)
    if (skills) {
      const skillsArray = Array.isArray(skills)
        ? skills
        : typeof skills === "string"
        ? skills.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      if (skillsArray.length > 0) {
        conditions.push({ skills: { $in: skillsArray } });
      }
    }

    // Handle location filters
    // Location is stored as "State" or "State, City"
    // We need to match if location contains ANY of the selected states (OR logic)
    const locationConditions = [];

    if (location) {
      locationConditions.push({ location: new RegExp(location, "i") });
    }

    // Handle state - can be string or array
    // Match if location contains the state name (could be "State" or "State, City")
    if (state) {
      const stateArray = Array.isArray(state)
        ? state
        : typeof state === "string"
        ? [state]
        : [];
      if (stateArray.length > 0) {
        // Create regex patterns for each state
        // Match state name in location (works for both "State" and "State, City" formats)
        stateArray.forEach((s) => {
          const trimmed = s.trim();
          if (trimmed) {
            // Escape special regex characters in state name
            const escapedState = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            // Match state name anywhere in location string (case-insensitive)
            // For "State" format: matches exactly "State"
            // For "State, City" format: matches "State" at the beginning
            // Using ^ or start of string to ensure we match the state part (before comma)
            locationConditions.push({
              location: new RegExp(`^${escapedState}(,|$)`, "i"),
            });
          }
        });
      }
    }

    if (city) {
      locationConditions.push({ location: new RegExp(city, "i") });
    }

    // Apply location filter with OR logic
    // If multiple location conditions, use $or to match ANY of them
    if (locationConditions.length > 0) {
      if (locationConditions.length === 1) {
        // Single condition - add directly to conditions array
        conditions.push(locationConditions[0]);
      } else {
        // Multiple conditions - use $or to match ANY of them
        conditions.push({ $or: locationConditions });
      }
    }

    // Handle budget filters
    const budgetConditions = {};
    if (budget) {
      budgetConditions["budget.max"] = { $gte: parseInt(budget) };
    }
    if (minBudget) {
      const minBudgetNum = parseInt(minBudget);
      if (!isNaN(minBudgetNum)) {
        budgetConditions["budget.min"] = {
          ...(budgetConditions["budget.min"] || {}),
          $gte: minBudgetNum,
        };
      }
    }
    if (maxBudget) {
      const maxBudgetNum = parseInt(maxBudget);
      if (!isNaN(maxBudgetNum)) {
        budgetConditions["budget.max"] = {
          ...(budgetConditions["budget.max"] || {}),
          $lte: maxBudgetNum,
        };
      }
    }
    if (Object.keys(budgetConditions).length > 0) {
      conditions.push(budgetConditions);
    }

    // Handle search
    if (search) {
      conditions.push({ $text: { $search: search } });
    }

    // Handle complexity
    if (complexity) {
      const complexityValues = Array.isArray(complexity)
        ? complexity
        : complexity.split(",").map((item) => item.trim());
      const filteredValues = complexityValues.filter(Boolean);
      if (filteredValues.length > 0) {
        conditions.push({ duration: { $in: filteredValues } });
      }
    }

    // Build final query - use $and to combine all conditions
    // If only one condition, use it directly; otherwise wrap in $and
    const query = conditions.length === 1 ? conditions[0] : { $and: conditions };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Log the query for debugging (remove in production)
    console.log("=== MongoDB Query Debug ===");
    console.log("Query parameters received:");
    console.log("- state:", state);
    console.log("- skills:", skills);
    console.log("\nQuery structure:", JSON.stringify(query, null, 2));
    console.log("\nLocation conditions:", locationConditions.map(c => ({
      location: c.location instanceof RegExp ? c.location.toString() : c.location
    })));
    console.log("=== End Debug ===\n");

    const projects = await Project.find(query)
      .populate("clientId", "displayName profile.avatar rating")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Project.countDocuments(query);

    res.json({
      projects,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error in getAllProjects:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ error: error.message, details: error.stack });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("clientId", "displayName profile rating")
      .populate("hiredFreelancer", "displayName profile rating");

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (project.clientId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ error: "Not authorized to update this project" });
    }

    // If status is being changed to "finished", set finishedAt timestamp
    const updateData = { ...req.body };
    if (updateData.status === "finished" && project.status !== "finished") {
      updateData.finishedAt = new Date();
      
      // Create notification for hired freelancer
      if (project.hiredFreelancer) {
        await Notification.create({
          userId: project.hiredFreelancer,
          type: "project",
          title: "Project Finished",
          message: `Project "${project.title}" has been marked as finished by the client.`,
          relatedId: project._id,
          relatedModel: "Project",
        });

        // Emit real-time notification
        const { getIO } = require("../utils/socket");
        const io = getIO();
        if (io) {
          io.to(project.hiredFreelancer.toString()).emit("notification:new", {
            type: "project",
            title: "Project Finished",
            message: `Project "${project.title}" has been marked as finished by the client.`,
            relatedId: project._id,
          });
        }
      }
    }

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      message: "Project updated successfully",
      project: updatedProject,
    });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (project.clientId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this project" });
    }

    await Project.findByIdAndDelete(req.params.id);

    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMyProjects = async (req, res) => {
  try {
    const projects = await Project.find({ clientId: req.user._id })
      .sort({ createdAt: -1 })
      .populate("hiredFreelancer", "displayName profile");

    res.json({ projects });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
