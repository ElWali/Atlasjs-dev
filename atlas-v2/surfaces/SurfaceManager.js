class SurfaceManager {
  constructor(engine) {
    this.engine = engine;
    this.surfaces = [];
  }

  mount(surface) {
    this.surfaces.push(surface);
    // Logic to add the surface to the map will go here.
    console.log(`Mounting surface:`, surface);
  }

  unmount(surface) {
    const index = this.surfaces.indexOf(surface);
    if (index > -1) {
      this.surfaces.splice(index, 1);
      // Logic to remove the surface from the map will go here.
      console.log(`Unmounting surface:`, surface);
    }
  }
}

export default SurfaceManager;