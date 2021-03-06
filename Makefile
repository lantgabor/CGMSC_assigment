# Flags
CFLAGS = -std=c99 -pedantic -O1


#if shared library target
#CFLAGS += -shared -undefined dynamic_lookup

TARGET_EXEC ?= build
BUILD_DIR ?= ./build/
SRC_DIRS ?= ./src_rt

SRCS := $(shell find $(SRC_DIRS) -name *.cpp -or -name *.c -or -name *.s)
OBJS := $(SRCS:%=$(BUILD_DIR)/%.o)

DEPS := $(OBJS:.o=.d)


INC := #-I./include/
INC_DIRS := $(shell find $(SRC_DIRS) -type d)
INC_FLAGS := $(addprefix -I,$(INC_DIRS))

CPPFLAGS = $(INC_FLAGS) -MMD -MP -ggdb
CXXFLAGS = -std=c++17 -g
LDFLAGS =  -lGLEW -lGLU -lSDL2 -lSDL2_image -lGL -lfreetype

# main target(C)
#$(BUILD_DIR)/$(TARGET_EXEC): $(OBJS)
#	$(CC) $(OBJS) -o $@ $(LDFLAGS)

# main target (C++)
$(BUILD_DIR)/$(TARGET_EXEC): $(OBJS)
	$(CXX) $(OBJS) -o $@ $(LDFLAGS)

# assembly
$(BUILD_DIR)/%.s.o: %.s
	$(MKDIR_P) $(dir $@)
	$(AS) $(ASFLAGS) -c $< -o $@

# c source
$(BUILD_DIR)/%.c.o: %.c
	$(MKDIR_P) $(dir $@)
	$(CC) $(CPPFLAGS) $(CFLAGS) $(INC) -c $< -o $@

# c++ source
$(BUILD_DIR)/%.cpp.o: %.cpp
	$(MKDIR_P) $(dir $@)
	$(CXX) $(CPPFLAGS) $(CXXFLAGS) $(INC) -c $< -o $@


.PHONY: clean

clean:
	$(RM) -r $(BUILD_DIR)

-include $(DEPS)

MKDIR_P ?= mkdir -p


.PHONY: run
run: $(BIN)
	./build/project-name
