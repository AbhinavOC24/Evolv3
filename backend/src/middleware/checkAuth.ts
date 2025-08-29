import { Request, Response, NextFunction } from "express";

export const checkAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.session?.userId) {
    return next();
  }

  res.status(401).json({
    sucess: false,
    message: "Not authenticated",
    authenticated: false,
  });
};
