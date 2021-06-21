@echo off

REM TODO: we shouldn't call this every build
if not defined DevEnvDir (



call "C:\Program Files (x86)\Microsoft Visual Studio\2019\Community\VC\Auxiliary\Build\vcvars32.bat"
)

REM /Otx
REM Compiler options
SET COMPILER_SETTINGS=-Zi -MT /EHsc /nologo
REM SET WARNING_SETTINGS=/W4 /WX
REM SET DISABLED_WARNINGS=/wd4100 /wd4189 /wd4459 /wd4456 /wd4996 /wd4706 /wd4127 /wd4018 /wd4293 /wd4800 /wd4101

SET LIBS=..\lib\x86\SDL2.lib ..\lib\x86\SDL2main.lib ..\lib\x86\SDL2_image.lib ..\lib\x86\glew32.lib opengl32.lib glu32.lib shell32.lib
SET FILES=..\src\*.cpp ..\src\imgui\*.cpp

REM Going into build directory
IF NOT EXIST .\build mkdir .\build
pushd .\build

REM Actual build
cl %COMPILER_SETTINGS% %FILES% -I ..\include %LIBS% /link /SUBSYSTEM:WINDOWS

popd