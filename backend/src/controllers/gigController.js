const Gig = require("../models/Gig");

exports.createGig = async (req, res) => {
  try {
    const gig = await Gig.create({
      ...req.body,
      freelancerId: req.user._id,
    });

    res.status(201).json({ message: "Gig created successfully", gig });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllGigs = async (req, res) => {
  try {
    const { category, skills, search, page = 1, limit = 12 } = req.query;
    const query = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (skills) {
      query.skills = { $in: skills.split(",") };
    }

    if (search) {
      query.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const gigs = await Gig.find(query)
      .populate("freelancerId", "displayName profile.avatar rating")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Gig.countDocuments(query);

    res.json({
      gigs,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getGigById = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id).populate(
      "freelancerId",
      "displayName profile rating completedProjects"
    );

    if (!gig) {
      return res.status(404).json({ error: "Gig not found" });
    }

    res.json(gig);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateGig = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);

    if (!gig) {
      return res.status(404).json({ error: "Gig not found" });
    }

    if (gig.freelancerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const updatedGig = await Gig.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ message: "Gig updated successfully", gig: updatedGig });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteGig = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);

    if (!gig) {
      return res.status(404).json({ error: "Gig not found" });
    }

    if (gig.freelancerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await Gig.findByIdAndDelete(req.params.id);

    res.json({ message: "Gig deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMyGigs = async (req, res) => {
  try {
    const gigs = await Gig.find({ freelancerId: req.user._id }).sort({
      createdAt: -1,
    });

    res.json({ gigs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
