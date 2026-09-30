# Tomcat 01 Blender opener

The opener is a three-second original scientific schematic. It travels from the luminous plasma ring to the surrounding magnetic coils and simplified divertor targets. It is not a reconstruction of EAST or ITER and must be labelled `科学示意` in the final composition.

Rebuild:

```powershell
./blender/render-tokamak-opener.ps1 -StillsOnly
./blender/render-tokamak-opener.ps1
```

Generated working files under `out/tomcat-01/blender/` are ignored. The small encoded insert at `episodes/tomcat-01/assets/tokamak-opener.mp4` is committed for reproducibility. Run `npm run episode:prepare -- tomcat-01` to stage it for Remotion.
